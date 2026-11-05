import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type Client = SupabaseClient<Database>;

export const EXPORT_VERSION = 1;

export interface JournalExport {
  version: number;
  exportedAt: string;
  profile: Record<string, unknown> | null;
  tags: { id: string; name: string; is_default: boolean }[];
  entries: (Database["public"]["Tables"]["entries"]["Row"] & {
    emotions: Database["public"]["Tables"]["entry_emotions"]["Row"][];
    tag_ids: string[];
    attachments: Database["public"]["Tables"]["attachments"]["Row"][];
  })[];
  letters: Database["public"]["Tables"]["future_letters"]["Row"][];
  streak: Database["public"]["Tables"]["streaks"]["Row"] | null;
}

/**
 * Everything a user has, as plain JSON. With the user client, RLS keeps sealed
 * letters out. With the admin client (backups) sealed letters are included so a
 * restore loses nothing.
 */
export async function buildExport(
  supabase: Client,
  userId: string,
  range?: { from?: string; to?: string },
): Promise<JournalExport> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, is_default")
    .eq("user_id", userId);

  const entries: JournalExport["entries"] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    let q = supabase
      .from("entries")
      .select("*, entry_emotions(*), entry_tags(tag_id), attachments(*)")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .range(from, from + pageSize - 1);
    if (range?.from) q = q.gte("entry_date", range.from);
    if (range?.to) q = q.lte("entry_date", range.to);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      const {
        entry_emotions,
        entry_tags,
        attachments,
        search: _search,
        ...rest
      } = r as typeof r & { search?: unknown };
      void _search;
      entries.push({
        ...rest,
        emotions: entry_emotions ?? [],
        tag_ids: (entry_tags ?? []).map((t) => t.tag_id),
        attachments: attachments ?? [],
      } as JournalExport["entries"][number]);
    }
    if (!data || data.length < pageSize) break;
  }

  const { data: letters } = await supabase.from("future_letters").select("*").eq("user_id", userId);
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let safeProfile: Record<string, unknown> | null = null;
  if (profile) {
    const { pin_hash: _pin, ...rest } = profile;
    void _pin;
    safeProfile = rest;
  }

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: safeProfile,
    tags: tags ?? [],
    entries,
    letters: letters ?? [],
    streak: streak ?? null,
  };
}

const KEEP = 8;

/** Write a JSON backup to the private "backups" bucket and keep the newest 8. */
export async function writeBackup(admin: Client, userId: string): Promise<string> {
  const data = await buildExport(admin, userId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `${userId}/backup-${stamp}.json`;
  const { error } = await admin.storage
    .from("backups")
    .upload(path, new Blob([JSON.stringify(data)], { type: "application/json" }), {
      contentType: "application/json",
    });
  if (error) throw new Error(error.message);

  const { data: files } = await admin.storage
    .from("backups")
    .list(userId, { limit: 100, sortBy: { column: "name", order: "desc" } });
  const old = (files ?? []).filter((f) => f.name.startsWith("backup-")).slice(KEEP);
  if (old.length) await admin.storage.from("backups").remove(old.map((f) => `${userId}/${f.name}`));
  return path;
}
