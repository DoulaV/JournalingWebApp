// Pure reminder scheduling. The cron job runs every 15 minutes (and may run
// late), so each kind of notification has a window after its time during which
// it can still go out, and each kind is sent at most once per local day.
// Never more than 2 notifications a day, and nothing once today is written.

import { localDate, localMinutes, timeToMinutes, type DateStr } from "./dates";

export type NotificationKind = "morning" | "reminder" | "nudge" | "letter";

export const MAX_PER_DAY = 2;
const WINDOWS: Record<Exclude<NotificationKind, "letter">, number> = {
  morning: 180,
  reminder: 120,
  nudge: 60,
};

export interface ReminderSettings {
  timeZone: string;
  remindersEnabled: boolean;
  reminderTime: string; // "HH:MM"
  nudgeEnabled: boolean;
  nudgeTime: string;
  morningReminderEnabled: boolean;
  morningReminderTime: string;
}

export interface SentState {
  sentOn: DateStr | null;
  sentCount: number;
  sentKinds: string | null; // comma-separated kinds sent on sentOn
}

export interface DecideInput {
  now: Date;
  settings: ReminderSettings;
  sent: SentState;
  wroteToday: boolean;
  letterReady?: boolean;
}

export interface Decision {
  kind: NotificationKind;
  today: DateStr;
  nextSent: { sentOn: DateStr; sentCount: number; sentKinds: string };
}

function inWindow(minutes: number, at: string, width: number): boolean {
  const start = timeToMinutes(at);
  return minutes >= start && minutes < start + width;
}

export function decideNotification({ now, settings, sent, wroteToday, letterReady }: DecideInput): Decision | null {
  const today = localDate(now, settings.timeZone);
  const minutes = localMinutes(now, settings.timeZone);
  const sameDay = sent.sentOn === today;
  const count = sameDay ? sent.sentCount : 0;
  const kinds = new Set(sameDay && sent.sentKinds ? sent.sentKinds.split(",") : []);
  if (count >= MAX_PER_DAY) return null;

  const pick = (kind: NotificationKind): Decision => ({
    kind,
    today,
    nextSent: { sentOn: today, sentCount: count + 1, sentKinds: [...kinds, kind].join(",") },
  });

  if (letterReady && !kinds.has("letter")) return pick("letter");
  if (wroteToday) return null;

  if (
    settings.morningReminderEnabled &&
    !kinds.has("morning") &&
    inWindow(minutes, settings.morningReminderTime, WINDOWS.morning)
  ) {
    return pick("morning");
  }
  if (settings.remindersEnabled && !kinds.has("reminder") && inWindow(minutes, settings.reminderTime, WINDOWS.reminder)) {
    return pick("reminder");
  }
  if (
    settings.remindersEnabled &&
    settings.nudgeEnabled &&
    !kinds.has("nudge") &&
    timeToMinutes(settings.nudgeTime) > timeToMinutes(settings.reminderTime) &&
    inWindow(minutes, settings.nudgeTime, WINDOWS.nudge)
  ) {
    return pick("nudge");
  }
  return null;
}

/** Rotate warm copy by day so it doesn't feel repetitive. */
export function pickCopy(list: string[], today: DateStr): string {
  const n = Number(today.replaceAll("-", "")) || 0;
  return list[n % list.length];
}
