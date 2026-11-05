import "server-only";
import { cache } from "react";
import { serverClient } from "./clients/server";
import type { Profile, ProfileRow } from "./types";
import { requireUser, requireUserAllowLocked } from "./auth";

export function toProfile(r: ProfileRow): Profile {
  return {
    displayName: r.display_name ?? "",
    timezone: r.timezone,
    language: r.language === "ar" ? "ar" : "en",
    theme: (r.theme as Profile["theme"]) ?? "system",
    palette: r.palette,
    fontSize: r.font_size,
    hasPin: Boolean(r.pin_hash),
    lockTimeoutMinutes: r.lock_timeout_minutes,
    showStreak: r.show_streak,
    emotionDepthUnlocked: r.emotion_depth_unlocked,
    showPrompts: r.show_prompts,
    bodyCheckEnabled: r.body_check_enabled,
    remindersEnabled: r.reminders_enabled,
    reminderTime: r.reminder_time.slice(0, 5),
    reminderAnchor: r.reminder_anchor,
    nudgeEnabled: r.nudge_enabled,
    nudgeTime: r.nudge_time.slice(0, 5),
    morningReminderEnabled: r.morning_reminder_enabled,
    morningReminderTime: r.morning_reminder_time.slice(0, 5),
    transcriptionEnabled: r.transcription_enabled,
    aiReflectionEnabled: r.ai_reflection_enabled,
  };
}

/** Loads the profile, creating it if the signup trigger has not run (defensive). */
const loadProfileRow = cache(async (userId: string): Promise<ProfileRow> => {
  const user = { id: userId };
  const supabase = await serverClient();
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (data) return data;
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: user.id })
    .select("*")
    .single();
  if (error || !created) throw new Error(`Could not create profile: ${error?.message}`);
  return created;
});

export async function getProfileRow(): Promise<ProfileRow> {
  const user = await requireUser();
  return loadProfileRow(user.id);
}

/** Profile for the lock screen and PIN actions, available while locked. */
export async function getProfileRowAllowLocked(): Promise<ProfileRow> {
  const user = await requireUserAllowLocked();
  return loadProfileRow(user.id);
}

export async function getProfile(): Promise<Profile> {
  return toProfile(await getProfileRow());
}

export type ProfilePatch = Partial<
  Omit<ProfileRow, "id" | "user_id" | "created_at" | "updated_at" | "pin_hash">
>;

export async function updateProfile(patch: ProfilePatch) {
  const user = await requireUser();
  const supabase = await serverClient();
  const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function setPinHash(hash: string | null) {
  const user = await requireUser();
  const supabase = await serverClient();
  const { error } = await supabase
    .from("profiles")
    .update({ pin_hash: hash })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function getPinHash(): Promise<string | null> {
  return (await getProfileRow()).pin_hash;
}
