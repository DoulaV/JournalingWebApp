"use server";

import { revalidatePath } from "next/cache";
import { EntryDateError, deleteEntry, saveEntry } from "@/lib/data/entries";
import { createTag } from "@/lib/data/tags";
import type { SaveEntryInput } from "@/lib/data/types";
import { markMilestonesSeen } from "@/lib/data/streaks";
import { nextPromptForToday } from "@/lib/data/prompts";

export type SaveResult =
  | { ok: true; savedAt: string; streak: { current: number; longest: number; total: number; freezes: number; atRisk: boolean } }
  | { ok: false; reason: "date" | "error" };

export async function saveEntryAction(input: SaveEntryInput): Promise<SaveResult> {
  try {
    const { streak } = await saveEntry(input);
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      streak: {
        current: streak.current,
        longest: streak.longest,
        total: streak.total,
        freezes: streak.freezes,
        atRisk: streak.atRisk,
      },
    };
  } catch (e) {
    if (e instanceof EntryDateError) return { ok: false, reason: "date" };
    console.error("saveEntry failed", e);
    return { ok: false, reason: "error" };
  }
}

export async function finishCheckInAction() {
  revalidatePath("/today");
}

export async function deleteEntryAction(date: string) {
  await deleteEntry(date);
  revalidatePath("/entries");
  revalidatePath("/today");
}

export async function createTagAction(name: string) {
  return createTag(name);
}

export async function markMilestonesSeenAction() {
  await markMilestonesSeen();
}

export async function anotherPromptAction(currentId: string | null) {
  return nextPromptForToday({ skipId: currentId });
}
