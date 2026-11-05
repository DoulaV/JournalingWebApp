"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { updateProfile } from "@/lib/data/profile";
import { isValidTimeZone } from "@/lib/dates";

const time = z.string().regex(/^\d{2}:\d{2}$/);

const settingsSchema = z
  .object({
    display_name: z.string().max(60),
    timezone: z.string().refine(isValidTimeZone),
    language: z.enum(["en", "ar"]),
    theme: z.enum(["system", "light", "dark"]),
    palette: z.enum(["calm", "dusk"]),
    font_size: z.number().int().min(14).max(28),
    lock_timeout_minutes: z.number().int().min(1).max(240),
    show_streak: z.boolean(),
    emotion_depth_unlocked: z.number().int().min(1).max(3),
    show_prompts: z.boolean(),
    body_check_enabled: z.boolean(),
    reminders_enabled: z.boolean(),
    reminder_time: time,
    reminder_anchor: z.string().max(60),
    nudge_enabled: z.boolean(),
    nudge_time: time,
    morning_reminder_enabled: z.boolean(),
    morning_reminder_time: time,
    transcription_enabled: z.boolean(),
    ai_reflection_enabled: z.boolean(),
  })
  .partial();

export type SettingsPatch = z.infer<typeof settingsSchema>;

export async function updateSettingsAction(patch: SettingsPatch) {
  const clean = settingsSchema.parse(patch);
  await updateProfile(clean);
  if (clean.language) {
    (await cookies()).set("lang", clean.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setFontSizeAction(size: number) {
  await updateProfile({ font_size: z.number().int().min(14).max(28).parse(size) });
}
