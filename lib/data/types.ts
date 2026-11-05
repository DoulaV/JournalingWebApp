import type { Database } from "./database.types";
import type { CoreId, EmotionPath } from "@/lib/emotions";
import type { DateStr } from "@/lib/dates";

type Tables = Database["public"]["Tables"];
export type ProfileRow = Tables["profiles"]["Row"];
export type EntryRow = Tables["entries"]["Row"];
export type EntryEmotionRow = Tables["entry_emotions"]["Row"];
export type TagRow = Tables["tags"]["Row"];
export type AttachmentRow = Tables["attachments"]["Row"];
export type StreakRow = Tables["streaks"]["Row"];
export type StreakEventRow = Tables["streak_events"]["Row"];
export type Ritual = "morning" | "evening" | "free";

export interface EmotionInput extends EmotionPath {
  core: CoreId;
  intensity: number; // 1..5
  bodyLocation?: string | null;
}

export interface Attachment {
  id: string;
  kind: "photo" | "audio";
  storagePath: string;
  mimeType: string | null;
  transcript: string | null;
  durationSeconds: number | null;
  url?: string; // signed URL, short-lived
}

export interface Entry {
  id: string;
  date: DateStr;
  title: string;
  body: unknown; // TipTap JSON
  bodyText: string;
  moodValence: number | null;
  wordCount: number;
  ritual: Ritual;
  isBackfilled: boolean;
  promptId: string | null;
  emotions: EmotionInput[];
  tagIds: string[];
  attachments: Attachment[];
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SaveEntryInput {
  date: DateStr;
  title?: string;
  body?: unknown;
  bodyText: string;
  moodValence?: number | null;
  emotions?: EmotionInput[];
  tagIds?: string[];
  ritual?: Ritual;
  promptId?: string | null;
  /** Client time the draft was started (ms), for offline drafts synced late. */
  clientCreatedAt?: number;
}

export interface Profile {
  displayName: string;
  timezone: string;
  language: "en" | "ar";
  theme: "system" | "light" | "dark";
  palette: string;
  fontSize: number;
  hasPin: boolean;
  lockTimeoutMinutes: number;
  showStreak: boolean;
  emotionDepthUnlocked: number;
  showPrompts: boolean;
  bodyCheckEnabled: boolean;
  remindersEnabled: boolean;
  reminderTime: string;
  reminderAnchor: string;
  nudgeEnabled: boolean;
  nudgeTime: string;
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  transcriptionEnabled: boolean;
  aiReflectionEnabled: boolean;
}
