// Pure aggregations over entries for the calendar, heatmap, insights and recaps.

import { CORE_IDS, getCore, pathKey, type CoreId } from "./emotions";
import { dayOfWeek, startOfMonth, startOfWeek, type DateStr } from "./dates";
import type { EmotionInput } from "./data/types";

export interface InsightEntry {
  date: DateStr;
  emotions: EmotionInput[];
  moodValence: number | null;
  tagIds: string[];
  wordCount?: number;
}

/**
 * Stacking order for charts. The spec's Angry and Fearful colors are nearly
 * identical, so they are never placed next to each other (validated for
 * colorblind separation). Charts also carry legends, tooltips and a table view.
 */
export const CHART_ORDER: CoreId[] = [
  "happy",
  "surprised",
  "bad",
  "sad",
  "fearful",
  "disgusted",
  "angry",
];

/** How pleasant each core feeling is, from -1 (hard) to 1 (pleasant). */
export const CORE_VALENCE: Record<CoreId, number> = {
  happy: 1,
  surprised: 0.3,
  bad: -0.5,
  sad: -1,
  fearful: -1,
  angry: -1,
  disgusted: -0.8,
};

/** The strongest feeling of a day (ties go to the one chosen first). */
export function dominantEmotion(e: InsightEntry): EmotionInput | null {
  let best: EmotionInput | null = null;
  for (const em of e.emotions) if (!best || em.intensity > best.intensity) best = em;
  return best;
}

export interface DayCell {
  color: string | null;
  core: CoreId | null;
  intensity: number; // 0 when no entry
  hasEntry: boolean;
}

const NEUTRAL = "#a8a29e";

export function dayCell(e: InsightEntry | undefined): DayCell {
  if (!e) return { color: null, core: null, intensity: 0, hasEntry: false };
  const d = dominantEmotion(e);
  if (!d) return { color: NEUTRAL, core: null, intensity: 3, hasEntry: true };
  return { color: getCore(d.core).color, core: d.core, intensity: d.intensity, hasEntry: true };
}

/** Opacity for heatmap shading by intensity (1 mild to 5 strong). */
export function intensityOpacity(intensity: number): number {
  if (intensity <= 0) return 0;
  return 0.3 + (Math.min(5, intensity) - 1) * 0.175;
}

/** Pleasantness of a day from 1 (hard) to 5 (pleasant). */
export function dayPleasantness(e: InsightEntry): number | null {
  if (e.emotions.length) {
    let num = 0;
    let den = 0;
    for (const em of e.emotions) {
      num += CORE_VALENCE[em.core] * em.intensity;
      den += em.intensity;
    }
    return Math.round((3 + 2 * (num / den)) * 100) / 100;
  }
  return e.moodValence ?? null;
}

export type Bucket = "week" | "month";

/** Feelings over time: per week or month, weighted counts by core (intensity as weight). */
export function emotionTrends(entries: InsightEntry[], bucket: Bucket) {
  const rows = new Map<string, Record<CoreId, number>>();
  for (const e of entries) {
    const key = bucket === "week" ? startOfWeek(e.date) : startOfMonth(e.date);
    const row =
      rows.get(key) ?? (Object.fromEntries(CORE_IDS.map((c) => [c, 0])) as Record<CoreId, number>);
    for (const em of e.emotions) row[em.core] += em.intensity;
    rows.set(key, row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, counts]) => ({ period, ...counts }));
}

/** Which cores appear with which tags. */
export function triggers(entries: InsightEntry[]) {
  const map = new Map<string, Record<CoreId, number> & { total: number }>();
  for (const e of entries) {
    for (const tag of e.tagIds) {
      const row =
        map.get(tag) ??
        ({ ...Object.fromEntries(CORE_IDS.map((c) => [c, 0])), total: 0 } as Record<
          CoreId,
          number
        > & { total: number });
      for (const em of e.emotions) {
        row[em.core] += 1;
        row.total += 1;
      }
      map.set(tag, row);
    }
  }
  return [...map.entries()]
    .map(([tagId, counts]) => ({ tagId, ...counts }))
    .sort((a, b) => b.total - a.total);
}

/** Average pleasantness by weekday, Monday first. */
export function dayOfWeekPattern(entries: InsightEntry[]) {
  const sums = Array.from({ length: 7 }, () => ({ total: 0, n: 0 }));
  for (const e of entries) {
    const p = dayPleasantness(e);
    if (p == null) continue;
    const i = (dayOfWeek(e.date) + 6) % 7;
    sums[i].total += p;
    sums[i].n += 1;
  }
  return sums.map((s, i) => ({
    weekday: i,
    average: s.n ? Math.round((s.total / s.n) * 100) / 100 : null,
    count: s.n,
  }));
}

export interface Recap {
  entries: number;
  mostCommon: { key: string; emotion: EmotionInput; count: number }[];
  strongestDays: { date: DateStr; emotion: EmotionInput }[];
  lifted: { tagId: string; score: number }[];
  drained: { tagId: string; score: number }[];
}

/** Monthly recap: most common feelings, strongest days, life areas that lifted or drained. */
export function recap(entries: InsightEntry[]): Recap {
  const counts = new Map<string, { emotion: EmotionInput; count: number }>();
  for (const e of entries) {
    for (const em of e.emotions) {
      const k = pathKey(em);
      const c = counts.get(k);
      if (c) c.count += 1;
      else counts.set(k, { emotion: em, count: 1 });
    }
  }
  const mostCommon = [...counts.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const strongestDays = entries
    .map((e) => ({ date: e.date, emotion: dominantEmotion(e) }))
    .filter((x): x is { date: DateStr; emotion: EmotionInput } => Boolean(x.emotion))
    .sort((a, b) => b.emotion.intensity - a.emotion.intensity || (a.date < b.date ? -1 : 1))
    .slice(0, 3);

  const overall = entries.map(dayPleasantness).filter((x): x is number => x != null);
  const base = overall.length ? overall.reduce((a, b) => a + b, 0) / overall.length : 3;
  const byTag = new Map<string, number[]>();
  for (const e of entries) {
    const p = dayPleasantness(e);
    if (p == null) continue;
    for (const t of e.tagIds) byTag.set(t, [...(byTag.get(t) ?? []), p]);
  }
  const scored = [...byTag.entries()]
    .filter(([, v]) => v.length >= 2)
    .map(([tagId, v]) => ({
      tagId,
      score: Math.round((v.reduce((a, b) => a + b, 0) / v.length - base) * 100) / 100,
    }));
  return {
    entries: entries.length,
    mostCommon,
    strongestDays,
    lifted: scored
      .filter((s) => s.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    drained: scored
      .filter((s) => s.score < -0.15)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
  };
}
