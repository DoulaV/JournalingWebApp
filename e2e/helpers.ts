import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

export const EMAIL = process.env.ALLOWED_EMAIL ?? "ahmed@example.com";

export function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export async function ensureUser(): Promise<string> {
  const a = admin();
  await a.rpc("sync_allowed_email", { p_email: EMAIL });
  const { data } = await a.auth.admin.listUsers();
  const existing = data.users.find((u) => u.email === EMAIL);
  if (existing) return existing.id;
  const { data: created, error } = await a.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(`createUser failed: ${error?.message}`);
  return created.user.id;
}

export async function signIn(page: Page) {
  await ensureUser();
  const { data, error } = await admin().auth.admin.generateLink({
    type: "magiclink",
    email: EMAIL,
  });
  if (error) throw error;
  await page.goto(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink`);
}

/** Clear journal data and reset the profile to defaults for a clean test. */
export async function resetUserData(overrides: Record<string, unknown> = {}) {
  const userId = await ensureUser();
  const a = admin();
  await a.from("entries").delete().eq("user_id", userId);
  await a.from("streak_events").delete().eq("user_id", userId);
  await a.from("prompt_history").delete().eq("user_id", userId);
  await a.from("future_letters").delete().eq("user_id", userId);
  await a.from("tags").delete().eq("user_id", userId).eq("is_default", false);
  await a
    .from("streaks")
    .update({
      current_length: 0,
      longest_length: 0,
      total_days_written: 0,
      freezes_available: 0,
      at_risk: false,
    })
    .eq("user_id", userId);
  await a
    .from("profiles")
    .update({
      language: "en",
      theme: "system",
      palette: "calm",
      pin_hash: null,
      emotion_depth_unlocked: 1,
      show_prompts: true,
      timezone: "Asia/Dubai",
      display_name: null,
      ...overrides,
    })
    .eq("user_id", userId);
  return userId;
}

/** Insert past entries directly (for streak and look-back tests). */
export async function seedEntries(
  userId: string,
  items: {
    date: string;
    text: string;
    core?: string;
    middle?: string | null;
    intensity?: number;
    tags?: string[];
  }[],
) {
  const a = admin();
  for (const it of items) {
    const { data: e, error } = await a
      .from("entries")
      .insert({
        user_id: userId,
        entry_date: it.date,
        body_text: it.text,
        body: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: it.text }] }],
        },
        word_count: it.text.split(/\s+/).length,
      })
      .select("id")
      .single();
    if (error || !e) throw new Error(error?.message);
    await a.from("entry_emotions").insert({
      user_id: userId,
      entry_id: e.id,
      core: it.core ?? "happy",
      middle: it.middle ?? null,
      intensity: it.intensity ?? 3,
      position: 1,
    });
    if (it.tags?.length) {
      const { data: tags } = await a
        .from("tags")
        .select("id, name")
        .eq("user_id", userId)
        .in("name", it.tags);
      if (tags?.length) {
        await a
          .from("entry_tags")
          .insert(tags.map((t) => ({ user_id: userId, entry_id: e.id, tag_id: t.id })));
      }
    }
  }
}

export function dubaiToday(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(d);
}

export function addDaysStr(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
