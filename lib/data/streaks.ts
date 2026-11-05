import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { computeStreak, type StreakState } from "@/lib/streak";
import { isValidEntry } from "./entry-utils";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";

type Client = SupabaseClient<Database>;

/** Dates with a valid entry for a user. */
export async function validEntryDates(supabase: Client, userId: string): Promise<string[]> {
  const out: string[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("entries")
      .select("entry_date, body_text, mood_valence, entry_emotions(count)")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      const emotionCount = (r.entry_emotions as unknown as { count: number }[])?.[0]?.count ?? 0;
      if (isValidEntry({ bodyText: r.body_text, emotionCount, moodValence: r.mood_valence })) {
        out.push(r.entry_date);
      }
    }
    if (!data || data.length < pageSize) break;
  }
  return out;
}

/** Recompute from history and persist. Works with the user client (RLS) or the admin client (cron). */
export async function recomputeStreakFor(
  supabase: Client,
  userId: string,
  timeZone: string,
  now: Date,
): Promise<StreakState> {
  const dates = await validEntryDates(supabase, userId);
  const state = computeStreak({ writtenDates: dates, now, timeZone });

  const { error } = await supabase.from("streaks").upsert(
    {
      user_id: userId,
      current_length: state.current,
      longest_length: state.longest,
      total_days_written: state.total,
      freezes_available: state.freezes,
      at_risk: state.atRisk,
      last_counted_date: state.lastCountedDate,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);

  // Replace derived events, keeping the "seen" flag on milestones already celebrated.
  const { data: seenRows } = await supabase
    .from("streak_events")
    .select("date, type")
    .eq("user_id", userId)
    .eq("seen", true);
  const seen = new Set((seenRows ?? []).map((r) => `${r.date}|${r.type}`));
  await supabase.from("streak_events").delete().eq("user_id", userId);
  const events = state.events.filter((e) => e.type !== "written");
  if (events.length) {
    await supabase.from("streak_events").insert(
      events.map((e) => ({
        user_id: userId,
        date: e.date,
        type: e.type,
        value: e.value ?? null,
        seen: seen.has(`${e.date}|${e.type}`),
      })),
    );
  }
  return state;
}

export interface StreakSummary {
  current: number;
  longest: number;
  total: number;
  freezes: number;
  atRisk: boolean;
}

export async function getStreak(): Promise<StreakSummary> {
  const user = await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle();
  return {
    current: data?.current_length ?? 0,
    longest: data?.longest_length ?? 0,
    total: data?.total_days_written ?? 0,
    freezes: data?.freezes_available ?? 0,
    atRisk: data?.at_risk ?? false,
  };
}

/** Milestone events not yet celebrated. */
export async function unseenMilestones(): Promise<number[]> {
  const user = await requireUser();
  const supabase = await serverClient();
  const { data } = await supabase
    .from("streak_events")
    .select("value")
    .eq("user_id", user.id)
    .eq("type", "milestone")
    .eq("seen", false)
    .order("date", { ascending: false })
    .limit(3);
  return (data ?? []).map((r) => r.value ?? 0).filter(Boolean);
}

export async function markMilestonesSeen() {
  const user = await requireUser();
  const supabase = await serverClient();
  await supabase
    .from("streak_events")
    .update({ seen: true })
    .eq("user_id", user.id)
    .eq("type", "milestone");
}
