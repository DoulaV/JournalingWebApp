#!/usr/bin/env node
// Restore a journal from a JSON backup or export into a Supabase project.
//
// Usage:
//   node scripts/restore.mjs path/to/backup.json
//   node scripts/restore.mjs --latest        (newest file in the "backups" bucket)
//
// Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ALLOWED_EMAIL
// from the environment (or .env.local). The owner account is created if it does
// not exist yet. Running it twice is safe: rows are upserted by id.
// Photos and voice notes are files in storage, not in the JSON: copy them with
// the Markdown export zip or the Supabase dashboard (see README).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // env provided directly
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ALLOWED_EMAIL ?? "").toLowerCase();
if (!url || !key || !email) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ALLOWED_EMAIL first.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function ownerId() {
  await admin.rpc("sync_allowed_email", { p_email: email });
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

async function loadBackup(arg, userId) {
  if (arg === "--latest") {
    const { data: files } = await admin.storage
      .from("backups")
      .list(userId, { sortBy: { column: "name", order: "desc" } });
    const latest = (files ?? []).find((f) => f.name.startsWith("backup-"));
    if (!latest) throw new Error("No backups found in storage for this user.");
    const { data } = await admin.storage.from("backups").download(`${userId}/${latest.name}`);
    console.log(`Using ${latest.name}`);
    return JSON.parse(await data.text());
  }
  return JSON.parse(fs.readFileSync(arg, "utf8"));
}

function check(res, what) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/restore.mjs <backup.json | --latest>");
    process.exit(1);
  }
  const userId = await ownerId();
  const backup = await loadBackup(arg, userId);
  if (!backup || !Array.isArray(backup.entries))
    throw new Error("This file is not a journal backup.");

  if (backup.profile) {
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...settings } = backup.profile;
    check(await admin.from("profiles").update(settings).eq("user_id", userId), "profile");
  }

  // Tags are matched by name so default tags line up with the new account.
  const tagMap = new Map();
  for (const t of backup.tags ?? []) {
    const res = await admin
      .from("tags")
      .upsert(
        { user_id: userId, name: t.name, is_default: t.is_default },
        { onConflict: "user_id,name" },
      )
      .select("id")
      .single();
    check(res, "tag");
    tagMap.set(t.id, res.data.id);
  }

  let n = 0;
  for (const e of backup.entries) {
    const { emotions, tag_ids, attachments, ...row } = e;
    const res = await admin
      .from("entries")
      .upsert({ ...row, user_id: userId }, { onConflict: "user_id,entry_date" })
      .select("id")
      .single();
    check(res, `entry ${e.entry_date}`);
    const entryId = res.data.id;
    await admin.from("entry_emotions").delete().eq("entry_id", entryId);
    if (emotions?.length) {
      check(
        await admin
          .from("entry_emotions")
          .insert(
            emotions.map(({ id: _i, ...m }) => ({ ...m, user_id: userId, entry_id: entryId })),
          ),
        "emotions",
      );
    }
    await admin.from("entry_tags").delete().eq("entry_id", entryId);
    const tags = (tag_ids ?? []).map((id) => tagMap.get(id)).filter(Boolean);
    if (tags.length) {
      check(
        await admin
          .from("entry_tags")
          .insert(tags.map((tag_id) => ({ user_id: userId, entry_id: entryId, tag_id }))),
        "entry tags",
      );
    }
    for (const a of attachments ?? []) {
      const { id: _i, ...att } = a;
      const path = att.storage_path.replace(/^[^/]+\//, `${userId}/`);
      await admin
        .from("attachments")
        .upsert({ ...att, storage_path: path, user_id: userId, entry_id: entryId });
    }
    n += 1;
  }

  for (const l of backup.letters ?? []) {
    check(await admin.from("future_letters").upsert({ ...l, user_id: userId }), "letter");
  }

  console.log(
    `Restored ${n} entries, ${(backup.letters ?? []).length} letters and ${tagMap.size} tags for ${email}.`,
  );
  console.log("Open the app once (or wait for the nightly job) to recompute the streak.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
