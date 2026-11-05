import "server-only";
import { serverClient } from "./clients/server";
import { requireUser } from "./auth";
import { getProfileRow } from "./profile";
import { getEntryByDate } from "./entries";
import { addDays, localDate } from "@/lib/dates";
import { getPrompt, pickPrompt, NO_REPEAT_DAYS, type Prompt } from "@/lib/prompts";

/**
 * The prompt for today's entry. Stable for the day: once chosen it is stored in
 * prompt_history and reused, so refreshing the page doesn't reshuffle it.
 * Chosen from the first feeling of today's entry, never repeating within 14 days.
 */
export async function promptForToday(
  opts: { skipId?: string | null; forceNew?: boolean } = {},
): Promise<Prompt | null> {
  const user = await requireUser();
  const profile = await getProfileRow();
  if (!profile.show_prompts) return null;
  const supabase = await serverClient();
  const today = localDate(new Date(), profile.timezone);

  const { data: history } = await supabase
    .from("prompt_history")
    .select("prompt_id, shown_on, created_at")
    .gte("shown_on", addDays(today, -NO_REPEAT_DAYS - 1))
    .order("created_at", { ascending: false });

  if (!opts.forceNew) {
    const shownToday = (history ?? []).find((h) => h.shown_on === today);
    const existing = shownToday ? getPrompt(shownToday.prompt_id) : undefined;
    if (existing) return existing;
  }

  const entry = await getEntryByDate(today);
  const first = entry?.emotions[0];
  const items = (history ?? []).map((h) => ({ promptId: h.prompt_id, shownOn: h.shown_on }));
  if (opts.skipId) items.push({ promptId: opts.skipId, shownOn: today });
  const prompt = pickPrompt({ core: first?.core, middle: first?.middle, today, history: items });

  await supabase
    .from("prompt_history")
    .upsert(
      { user_id: user.id, prompt_id: prompt.id, shown_on: today },
      { onConflict: "user_id,prompt_id,shown_on", ignoreDuplicates: true },
    );
  return prompt;
}

export async function nextPromptForToday({ skipId }: { skipId: string | null }) {
  const p = await promptForToday({ skipId, forceNew: true });
  if (!p) return null;
  // Make the new prompt today's prompt by touching its created_at ordering.
  return p;
}
