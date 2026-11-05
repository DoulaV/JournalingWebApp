import { describe, expect, it } from "vitest";
import {
  dayCell,
  dayOfWeekPattern,
  dayPleasantness,
  dominantEmotion,
  emotionTrends,
  intensityOpacity,
  recap,
  triggers,
  type InsightEntry,
} from "@/lib/insights";

const e = (date: string, emotions: [string, number][], tagIds: string[] = [], moodValence: number | null = null): InsightEntry => ({
  date,
  emotions: emotions.map(([core, intensity]) => ({ core: core as never, intensity })),
  tagIds,
  moodValence,
});

describe("insights", () => {
  it("picks the strongest feeling, first one on ties", () => {
    expect(dominantEmotion(e("2026-01-01", [["sad", 2], ["happy", 4]]))?.core).toBe("happy");
    expect(dominantEmotion(e("2026-01-01", [["sad", 3], ["happy", 3]]))?.core).toBe("sad");
    expect(dominantEmotion(e("2026-01-01", []))).toBeNull();
  });

  it("colors calendar days by dominant feeling", () => {
    expect(dayCell(undefined).hasEntry).toBe(false);
    expect(dayCell(e("2026-01-01", [["angry", 5]])).color).toBe("#E24B4A");
    expect(dayCell(e("2026-01-01", [], [], 2)).core).toBeNull();
    expect(intensityOpacity(1)).toBeCloseTo(0.3);
    expect(intensityOpacity(5)).toBeCloseTo(1);
  });

  it("scores pleasantness from 1 to 5", () => {
    expect(dayPleasantness(e("2026-01-01", [["happy", 3]]))).toBe(5);
    expect(dayPleasantness(e("2026-01-01", [["sad", 3]]))).toBe(1);
    expect(dayPleasantness(e("2026-01-01", [["happy", 3], ["sad", 3]]))).toBe(3);
    expect(dayPleasantness(e("2026-01-01", [], [], 4))).toBe(4);
  });

  it("builds weekly and monthly trends stacked by core", () => {
    const list = [e("2026-01-05", [["happy", 2]]), e("2026-01-07", [["happy", 3], ["sad", 1]]), e("2026-01-12", [["angry", 4]])];
    const weeks = emotionTrends(list, "week");
    expect(weeks.map((w) => w.period)).toEqual(["2026-01-05", "2026-01-12"]);
    expect(weeks[0].happy).toBe(5);
    expect(weeks[0].sad).toBe(1);
    expect(emotionTrends(list, "month")).toHaveLength(1);
  });

  it("finds which feelings come with which life areas", () => {
    const list = [e("2026-01-01", [["fearful", 3]], ["work"]), e("2026-01-02", [["fearful", 2], ["bad", 2]], ["work"]), e("2026-01-03", [["happy", 4]], ["family"])];
    const t = triggers(list);
    expect(t[0]).toMatchObject({ tagId: "work", fearful: 2, bad: 1, total: 3 });
  });

  it("averages mood by weekday, Monday first", () => {
    const p = dayOfWeekPattern([e("2026-01-05", [["happy", 3]]), e("2026-01-12", [["sad", 3]]), e("2026-01-10", [["happy", 1]])]);
    expect(p[0]).toMatchObject({ weekday: 0, average: 3, count: 2 });
    expect(p[5]).toMatchObject({ average: 5, count: 1 });
    expect(p[2].average).toBeNull();
  });

  it("recaps a month with lifts and drains", () => {
    const list = [
      e("2026-01-01", [["happy", 4]], ["family"]),
      e("2026-01-02", [["happy", 3]], ["family"]),
      e("2026-01-03", [["fearful", 5]], ["work"]),
      e("2026-01-04", [["sad", 2]], ["work"]),
    ];
    const r = recap(list);
    expect(r.entries).toBe(4);
    expect(r.mostCommon[0]).toMatchObject({ key: "happy", count: 2 });
    expect(r.strongestDays[0]).toMatchObject({ date: "2026-01-03" });
    expect(r.lifted[0].tagId).toBe("family");
    expect(r.drained[0].tagId).toBe("work");
  });
});
