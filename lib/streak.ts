// Streak engine. Pure functions only: given the dates that have a valid entry
// and the current instant in the user's timezone, recompute the full streak
// state from scratch. Recomputing from history keeps the result deterministic,
// so a nightly job and a save-time update always agree.
//
// Rules (see CLAUDE.md, section 6):
// - A day counts if it has a valid entry (one emotion and one non-empty sentence).
// - Grace: until 12:00 local time, yesterday is still open and can be written.
// - Freezes: 1 per 7 consecutive written days, hold at most 3. A missed day uses
//   one automatically and the streak continues without growing.
// - Never miss twice: a missed day with no freeze marks the streak at risk. A
//   second missed day in a row resets it to 0. Writing clears the risk.
// - Longest streak and total days written are never lost.

import { addDays, diffDays, GRACE_HOUR, localDate, localHour, type DateStr } from "./dates";

export const MILESTONES = [7, 14, 30, 50, 100, 200, 365, 500, 1000] as const;
export const MAX_FREEZES = 3;
export const DAYS_PER_FREEZE = 7;

export type StreakEventType = "written" | "freeze_used" | "at_risk" | "reset" | "milestone";

export interface StreakEvent {
  date: DateStr;
  type: StreakEventType;
  value?: number;
}

export interface StreakState {
  current: number;
  longest: number;
  total: number;
  freezes: number;
  atRisk: boolean;
  lastCountedDate: DateStr | null;
  events: StreakEvent[];
}

export interface StreakInput {
  /** Dates with a valid entry, any order, duplicates allowed. */
  writtenDates: DateStr[];
  now: Date;
  timeZone: string;
}

export function emptyStreak(): StreakState {
  return {
    current: 0,
    longest: 0,
    total: 0,
    freezes: 0,
    atRisk: false,
    lastCountedDate: null,
    events: [],
  };
}

/** Today and whether yesterday is still inside the grace window. */
export function streakClock(now: Date, timeZone: string) {
  const today = localDate(now, timeZone);
  const yesterday = addDays(today, -1);
  const graceOpen = localHour(now, timeZone) < GRACE_HOUR;
  return { today, yesterday, graceOpen };
}

/**
 * Which date a new entry written right now belongs to, if the user asks to
 * write for yesterday. Returns null when yesterday can no longer be written.
 */
export function backfillDate(now: Date, timeZone: string): DateStr | null {
  const { yesterday, graceOpen } = streakClock(now, timeZone);
  return graceOpen ? yesterday : null;
}

export function computeStreak({ writtenDates, now, timeZone }: StreakInput): StreakState {
  const state = emptyStreak();
  const written = new Set(writtenDates);
  if (written.size === 0) return state;

  const { today, yesterday, graceOpen } = streakClock(now, timeZone);
  const sorted = [...written].sort();
  const first = sorted[0];
  // Walk every day up to today. Entries dated after today (should not happen) are ignored.
  const last = today;

  let consecutive = 0; // consecutive written days, for earning freezes

  for (let d = first; d <= last; d = addDays(d, 1)) {
    const isWritten = written.has(d);
    const isFinal = d < today && !(d === yesterday && graceOpen);

    if (isWritten) {
      state.atRisk = false;
      state.current += 1;
      state.total += 1;
      consecutive += 1;
      state.events.push({ date: d, type: "written" });
      if (consecutive % DAYS_PER_FREEZE === 0 && state.freezes < MAX_FREEZES) {
        state.freezes += 1;
      }
      if ((MILESTONES as readonly number[]).includes(state.current)) {
        state.events.push({ date: d, type: "milestone", value: state.current });
      }
      state.longest = Math.max(state.longest, state.current);
      state.lastCountedDate = d;
      continue;
    }

    if (!isFinal) continue; // today, or yesterday during grace: still open

    state.lastCountedDate = d;
    consecutive = 0;
    if (state.current === 0 && !state.atRisk) continue; // nothing to protect

    if (state.atRisk) {
      // Second missed day in a row.
      state.current = 0;
      state.atRisk = false;
      state.events.push({ date: d, type: "reset" });
    } else if (state.freezes > 0) {
      state.freezes -= 1;
      state.events.push({ date: d, type: "freeze_used" });
    } else {
      state.atRisk = true;
      state.events.push({ date: d, type: "at_risk" });
    }
  }

  return state;
}

export function nextMilestone(current: number): number | null {
  return MILESTONES.find((m) => m > current) ?? null;
}

/** Milestones reached at some point (based on the longest streak ever). */
export function reachedMilestones(longest: number): number[] {
  return MILESTONES.filter((m) => m <= longest);
}

/** Days since the first entry, counting the first day as day 1. */
export function journalDayNumber(firstEntryDate: DateStr | null, today: DateStr): number {
  if (!firstEntryDate) return 1;
  return Math.max(1, diffDays(firstEntryDate, today) + 1);
}

/** Emotion picker depth from the gradual unlock schedule (1 core, 2 middle, 3 precise). */
export function emotionDepthForDay(day: number, manualUnlock: number = 1): 1 | 2 | 3 {
  const scheduled = day >= 22 ? 3 : day >= 8 ? 2 : 1;
  return Math.max(scheduled, Math.min(3, Math.max(1, manualUnlock))) as 1 | 2 | 3;
}
