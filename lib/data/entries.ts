import "server-only";
import { cache } from "react";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";
import { getProfileRow } from "./profile";
import { recomputeStreakFor } from "./streaks";
import { countWords } from "./entry-utils";
import type { Attachment, EmotionInput, Entry, SaveEntryInput } from "./types";
import { isValidPath, isCoreId } from "@/lib/emotions";
import { isDateStr, type DateStr } from "@/lib/dates";
import { streakClock } from "@/lib/streak";

const ENTRY_SELECT = "*, entry_emotions(*), entry_tags(tag_id), attachments(*)" as const;

type RawEntry = Awaited<ReturnType<typeof fetchRaw>>[number];

async function fetchRaw(filter: (q: ReturnType<typeof base>) => ReturnType<typeof base>) {
  const q = filter(base(await serverClient()));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

function base(supabase: Awaited<ReturnType<typeof serverClient>>) {
  return supabase.from("entries").select(ENTRY_SELECT);
}

function toEntry(r: RawEntry): Entry {
  const emotions = [...(r.entry_emotions ?? [])]
    .sort((a, b) => a.position - b.position)
    .filter((e) => isCoreId(e.core))
    .map((e): EmotionInput => ({
      core: e.core as EmotionInput["core"],
      middle: e.middle,
      precise: e.precise,
      intensity: e.intensity,
      bodyLocation: e.body_location,
    }));
  const attachments: Attachment[] = (r.attachments ?? []).map((a) => ({
    id: a.id,
    kind: a.kind as Attachment["kind"],
    storagePath: a.storage_path,
    mimeType: a.mime_type,
    transcript: a.transcript,
    durationSeconds: a.duration_seconds,
  }));
  return {
    id: r.id,
    date: r.entry_date,
    title: r.title,
    body: r.body,
    bodyText: r.body_text,
    moodValence: r.mood_valence,
    wordCount: r.word_count,
    ritual: r.ritual as Entry["ritual"],
    isBackfilled: r.is_backfilled,
    promptId: r.prompt_id,
    emotions,
    tagIds: (r.entry_tags ?? []).map((t) => t.tag_id),
    attachments,
    updatedAt: r.updated_at,
  };
}

/** Cached per request, so pages and helpers asking for the same day share one query. */
export const getEntryByDate = cache(async (date: DateStr): Promise<Entry | null> => {
  await requireUser();
  const rows = await fetchRaw((q) => q.eq("entry_date", date).limit(1));
  return rows[0] ? toEntry(rows[0]) : null;
});

export async function getEntriesByDates(dates: DateStr[]): Promise<Entry[]> {
  await requireUser();
  if (dates.length === 0) return [];
  const rows = await fetchRaw((q) => q.in("entry_date", dates));
  return rows.map(toEntry);
}

export async function listEntries(
  opts: { limit?: number; before?: DateStr } = {},
): Promise<Entry[]> {
  await requireUser();
  const limit = Math.min(opts.limit ?? 30, 200);
  const rows = await fetchRaw((q) => {
    let qq = q.order("entry_date", { ascending: false }).limit(limit);
    if (opts.before) qq = qq.lt("entry_date", opts.before);
    return qq;
  });
  return rows.map(toEntry);
}

export async function entriesInRange(from: DateStr, to: DateStr): Promise<Entry[]> {
  await requireUser();
  const rows = await fetchRaw((q) =>
    q.gte("entry_date", from).lte("entry_date", to).order("entry_date", { ascending: true }),
  );
  return rows.map(toEntry);
}

export async function firstEntryDate(): Promise<DateStr | null> {
  await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase
    .from("entries")
    .select("entry_date")
    .order("entry_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.entry_date ?? null;
}

export class EntryDateError extends Error {}

/** Which dates may receive a brand new entry right now: today, and yesterday during grace. */
export function writableDates(now: Date, timeZone: string): DateStr[] {
  const { today, yesterday, graceOpen } = streakClock(now, timeZone);
  return graceOpen ? [today, yesterday] : [today];
}

function cleanEmotions(list: EmotionInput[] | undefined): EmotionInput[] {
  if (!list) return [];
  return list
    .filter((e) => isValidPath(e))
    .slice(0, 3)
    .map((e) => ({
      core: e.core,
      middle: e.middle || null,
      precise: e.middle ? e.precise || null : null,
      intensity: Math.min(5, Math.max(1, Math.round(e.intensity || 3))),
      bodyLocation: e.bodyLocation || null,
    }));
}

export async function saveEntry(input: SaveEntryInput) {
  const user = await requireUser();
  const profile = await getProfileRow();
  const supabase = await serverClient();

  if (!isDateStr(input.date)) throw new EntryDateError("Invalid date");
  const now = new Date();

  const { data: existing } = await supabase
    .from("entries")
    .select("id, ritual")
    .eq("entry_date", input.date)
    .maybeSingle();

  // An offline draft started earlier may still count for the day it was started,
  // as long as it was started when that day was writable (and within 3 days).
  const started =
    input.clientCreatedAt &&
    input.clientCreatedAt < now.getTime() &&
    now.getTime() - input.clientCreatedAt < 3 * 86_400_000
      ? new Date(input.clientCreatedAt)
      : now;
  if (
    !existing &&
    !writableDates(now, profile.timezone).includes(input.date) &&
    !writableDates(started, profile.timezone).includes(input.date)
  ) {
    throw new EntryDateError("This day can no longer be written");
  }

  const bodyText = (input.bodyText ?? "").slice(0, 200_000);
  const valence =
    input.moodValence == null ? null : Math.min(5, Math.max(1, Math.round(input.moodValence)));

  const row = {
    user_id: user.id,
    entry_date: input.date,
    title: (input.title ?? "").slice(0, 200),
    body: (input.body ?? null) as never,
    body_text: bodyText,
    word_count: countWords(bodyText),
    ...(input.moodValence !== undefined ? { mood_valence: valence } : {}),
    ...(input.promptId !== undefined ? { prompt_id: input.promptId } : {}),
    ritual:
      existing?.ritual && existing.ritual !== "free" ? existing.ritual : (input.ritual ?? "free"),
    ...(!existing
      ? { is_backfilled: input.date < streakClock(started, profile.timezone).today }
      : {}),
  };

  const { data: saved, error } = await supabase
    .from("entries")
    .upsert(row, { onConflict: "user_id,entry_date" })
    .select("id")
    .single();
  if (error || !saved) throw new Error(error?.message ?? "Save failed");

  if (input.emotions !== undefined) {
    const emotions = cleanEmotions(input.emotions);
    await supabase.from("entry_emotions").delete().eq("entry_id", saved.id);
    if (emotions.length) {
      const { error: e2 } = await supabase.from("entry_emotions").insert(
        emotions.map((e, i) => ({
          user_id: user.id,
          entry_id: saved.id,
          core: e.core,
          middle: e.middle,
          precise: e.precise,
          intensity: e.intensity,
          position: i + 1,
          body_location: e.bodyLocation,
        })),
      );
      if (e2) throw new Error(e2.message);
    }
  }

  if (input.tagIds !== undefined) {
    await supabase.from("entry_tags").delete().eq("entry_id", saved.id);
    const ids = [...new Set(input.tagIds)].slice(0, 20);
    if (ids.length) {
      const { error: e3 } = await supabase
        .from("entry_tags")
        .insert(ids.map((tag_id) => ({ user_id: user.id, entry_id: saved.id, tag_id })));
      if (e3) throw new Error(e3.message);
    }
  }

  const streak = await recomputeStreakFor(supabase, user.id, profile.timezone, now);
  return { id: saved.id, streak };
}

export async function deleteEntry(date: DateStr) {
  const user = await requireUser();
  const profile = await getProfileRow();
  const supabase = await serverClient();
  const { data } = await supabase.from("entries").select("id").eq("entry_date", date).maybeSingle();
  if (!data) return;
  const { data: files } = await supabase
    .from("attachments")
    .select("storage_path")
    .eq("entry_id", data.id);
  if (files?.length)
    await supabase.storage.from("attachments").remove(files.map((f) => f.storage_path));
  await supabase.from("entries").delete().eq("id", data.id);
  await recomputeStreakFor(supabase, user.id, profile.timezone, new Date());
}

/** The user's most used emotion paths in the last 90 days, most frequent first. */
export async function recentEmotionKeys(limit = 5): Promise<EmotionInput[]> {
  await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase
    .from("entry_emotions")
    .select("core, middle, precise, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  const counts = new Map<string, { e: EmotionInput; n: number; last: string }>();
  for (const r of data ?? []) {
    if (!isCoreId(r.core)) continue;
    const key = [r.core, r.middle, r.precise].filter(Boolean).join("/");
    const cur = counts.get(key);
    if (cur) cur.n += 1;
    else
      counts.set(key, {
        e: { core: r.core, middle: r.middle, precise: r.precise, intensity: 3 },
        n: 1,
        last: r.created_at,
      });
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n || (a.last < b.last ? 1 : -1))
    .slice(0, limit)
    .map((c) => c.e);
}
