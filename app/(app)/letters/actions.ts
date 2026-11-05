"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLetter, deleteLetter } from "@/lib/data/letters";
import { getProfileRow } from "@/lib/data/profile";
import { getStreak } from "@/lib/data/streaks";
import { isUnlocked } from "@/lib/rewards";
import { isDateStr, localDate } from "@/lib/dates";

export async function createLetterAction(input: { title: string; body: string; sealedUntil: string }) {
  const parsed = z.object({ title: z.string().max(200), body: z.string().min(1).max(50_000), sealedUntil: z.string() }).parse(input);
  const profile = await getProfileRow();
  if (!isUnlocked("letters", (await getStreak()).longest)) return { ok: false as const, reason: "locked" };
  if (!isDateStr(parsed.sealedUntil) || parsed.sealedUntil <= localDate(new Date(), profile.timezone)) {
    return { ok: false as const, reason: "date" };
  }
  await createLetter(parsed);
  revalidatePath("/letters");
  return { ok: true as const };
}

export async function deleteLetterAction(id: string) {
  await deleteLetter(id);
  revalidatePath("/letters");
}
