import { describe, expect, it } from "vitest";
import {
  backfillDate,
  computeStreak,
  emotionDepthForDay,
  journalDayNumber,
  nextMilestone,
  reachedMilestones,
} from "@/lib/streak";
import { addDays, daysInRange } from "@/lib/dates";

const DUBAI = "Asia/Dubai"; // UTC+4, no DST
const NY = "America/New_York"; // DST zone

/** An instant at a local wall-clock time in Dubai (UTC+4). */
function dubai(date: string, time = "20:00"): Date {
  return new Date(`${date}T${time}:00+04:00`);
}

function range(from: string, count: number): string[] {
  return daysInRange(from, addDays(from, count - 1));
}

function run(dates: string[], now: Date, tz = DUBAI) {
  return computeStreak({ writtenDates: dates, now, timeZone: tz });
}

describe("normal streak", () => {
  it("is empty with no entries", () => {
    const s = run([], dubai("2026-01-10"));
    expect(s).toMatchObject({ current: 0, longest: 0, total: 0, freezes: 0, atRisk: false });
  });

  it("counts consecutive days including today", () => {
    const s = run(range("2026-01-01", 5), dubai("2026-01-05"));
    expect(s.current).toBe(5);
    expect(s.longest).toBe(5);
    expect(s.total).toBe(5);
    expect(s.atRisk).toBe(false);
  });

  it("does not break the streak when today is not written yet", () => {
    const s = run(range("2026-01-01", 4), dubai("2026-01-05", "22:00"));
    expect(s.current).toBe(4);
    expect(s.atRisk).toBe(false);
  });

  it("ignores duplicate dates and unsorted input", () => {
    const s = run(["2026-01-03", "2026-01-01", "2026-01-02", "2026-01-02"], dubai("2026-01-03"));
    expect(s.current).toBe(3);
    expect(s.total).toBe(3);
  });
});

describe("grace backfill", () => {
  it("keeps yesterday open until 12:00 and counts a backfilled entry", () => {
    // Wrote Jan 1 to Jan 3, missed writing on Jan 4 in the evening, it is now 09:00 on Jan 5.
    const before = run(range("2026-01-01", 3), dubai("2026-01-05", "09:00"));
    expect(before.current).toBe(3);
    expect(before.atRisk).toBe(false);
    expect(backfillDate(dubai("2026-01-05", "09:00"), DUBAI)).toBe("2026-01-04");

    // Backfill Jan 4 during grace: the streak keeps growing.
    const after = run([...range("2026-01-01", 3), "2026-01-04"], dubai("2026-01-05", "09:30"));
    expect(after.current).toBe(4);
  });

  it("closes yesterday at 12:00", () => {
    expect(backfillDate(dubai("2026-01-05", "12:00"), DUBAI)).toBeNull();
    const s = run(range("2026-01-01", 3), dubai("2026-01-05", "12:01"));
    // Jan 4 is now final and missed. No freeze yet, so at risk.
    expect(s.atRisk).toBe(true);
    expect(s.current).toBe(3);
  });
});

describe("freezes", () => {
  it("earns one freeze per 7 consecutive days", () => {
    expect(run(range("2026-01-01", 6), dubai("2026-01-06")).freezes).toBe(0);
    expect(run(range("2026-01-01", 7), dubai("2026-01-07")).freezes).toBe(1);
    expect(run(range("2026-01-01", 14), dubai("2026-01-14")).freezes).toBe(2);
  });

  it("caps freezes at 3", () => {
    const s = run(range("2026-01-01", 35), dubai("2026-02-04"));
    expect(s.current).toBe(35);
    expect(s.freezes).toBe(3);
  });

  it("uses a freeze automatically on a missed day, without adding length", () => {
    const dates = range("2026-01-01", 7); // freeze earned on Jan 7
    // Jan 8 missed, Jan 9 written
    const s = run([...dates, "2026-01-09"], dubai("2026-01-09"));
    expect(s.freezes).toBe(0);
    expect(s.current).toBe(8);
    expect(s.atRisk).toBe(false);
    expect(s.events).toContainEqual({ date: "2026-01-08", type: "freeze_used" });
  });

  it("restarts the 7-day count after a frozen day", () => {
    const dates = [...range("2026-01-01", 7), ...range("2026-01-09", 6)];
    // Freeze earned Jan 7, used Jan 8, then 6 more days: no new freeze yet.
    const s = run(dates, dubai("2026-01-14"));
    expect(s.freezes).toBe(0);
    const s2 = run([...dates, "2026-01-15"], dubai("2026-01-15"));
    expect(s2.freezes).toBe(1);
  });
});

describe("at risk", () => {
  it("marks at risk on a missed day with no freeze, then recovers when writing", () => {
    const dates = range("2026-01-01", 3);
    const risk = run(dates, dubai("2026-01-05", "13:00")); // Jan 4 missed
    expect(risk.atRisk).toBe(true);
    expect(risk.current).toBe(3);

    const recovered = run([...dates, "2026-01-05"], dubai("2026-01-05", "13:00"));
    expect(recovered.atRisk).toBe(false);
    expect(recovered.current).toBe(4);
    expect(recovered.events).toContainEqual({ date: "2026-01-04", type: "at_risk" });
  });

  it("resets after two missed days in a row, keeping history", () => {
    const dates = range("2026-01-01", 5);
    const s = run(dates, dubai("2026-01-08", "13:00")); // Jan 6 and Jan 7 missed
    expect(s.current).toBe(0);
    expect(s.atRisk).toBe(false);
    expect(s.longest).toBe(5);
    expect(s.total).toBe(5);
    expect(s.events).toContainEqual({ date: "2026-01-07", type: "reset" });

    const again = run([...dates, "2026-01-08"], dubai("2026-01-08"));
    expect(again.current).toBe(1);
    expect(again.longest).toBe(5);
    expect(again.total).toBe(6);
  });

  it("freezes first, then at risk, then reset", () => {
    const dates = range("2026-01-01", 7); // 1 freeze
    const s = run(dates, dubai("2026-01-11", "13:00")); // Jan 8 frozen, Jan 9 at risk, Jan 10 reset
    expect(s.events.filter((e) => e.type !== "written")).toEqual([
      { date: "2026-01-07", type: "milestone", value: 7 },
      { date: "2026-01-08", type: "freeze_used" },
      { date: "2026-01-09", type: "at_risk" },
      { date: "2026-01-10", type: "reset" },
    ]);
    expect(s.current).toBe(0);
  });
});

describe("milestones", () => {
  it("emits milestone events and finds the next one", () => {
    const s = run(range("2026-01-01", 30), dubai("2026-01-30"));
    const ms = s.events.filter((e) => e.type === "milestone").map((e) => e.value);
    expect(ms).toEqual([7, 14, 30]);
    expect(nextMilestone(30)).toBe(50);
    expect(nextMilestone(1000)).toBeNull();
    expect(reachedMilestones(60)).toEqual([7, 14, 30, 50]);
  });
});

describe("timezones", () => {
  it("handles the midnight boundary in the user's timezone", () => {
    // 23:59 in Dubai is still Jan 5. 00:01 is Jan 6.
    const dates = range("2026-01-01", 5);
    expect(run(dates, dubai("2026-01-05", "23:59")).current).toBe(5);
    const nextDay = run(dates, dubai("2026-01-06", "00:01"));
    expect(nextDay.current).toBe(5);
    expect(nextDay.atRisk).toBe(false);
    // The same instant is still Jan 5 in New York, nothing changes there either.
    expect(run(dates, dubai("2026-01-06", "00:01"), NY).current).toBe(5);
  });

  it("uses the user's timezone, not UTC, to decide what today is", () => {
    // 2026-01-05T21:30Z is 01:30 on Jan 6 in Dubai, 16:30 on Jan 5 in New York.
    const now = new Date("2026-01-05T21:30:00Z");
    const dates = range("2026-01-01", 4); // through Jan 4
    // Dubai: today Jan 6, yesterday Jan 5 in grace, so nothing is final yet.
    expect(run(dates, now, DUBAI)).toMatchObject({ current: 4, atRisk: false });
    // New York: today Jan 5, still open.
    expect(run(dates, now, NY)).toMatchObject({ current: 4, atRisk: false });
  });

  it("survives traveling to another timezone", () => {
    // Wrote in Dubai Jan 1 to Jan 3, then flew to New York and wrote Jan 4 (NY date).
    const dates = [...range("2026-01-01", 3), "2026-01-04"];
    const inNY = new Date("2026-01-04T22:00:00-05:00"); // Jan 5 03:00 UTC, Jan 5 in Dubai
    expect(run(dates, inNY, NY).current).toBe(4);
    // Coming back, the same entries still count in Dubai.
    expect(run(dates, dubai("2026-01-05", "08:00"), DUBAI).current).toBe(4);
  });

  it("works across a DST change in a DST zone", () => {
    // US DST started on 2026-03-08. Days must still be counted as single days.
    const dates = range("2026-03-05", 7); // Mar 5 to Mar 11
    const now = new Date("2026-03-11T23:30:00-04:00");
    const s = run(dates, now, NY);
    expect(s.current).toBe(7);
    expect(s.freezes).toBe(1);
    // Right after local midnight on Mar 12, the streak stays intact.
    expect(run(dates, new Date("2026-03-12T00:15:00-04:00"), NY).current).toBe(7);
    // And the day DST ends (Nov 1 2026) behaves the same.
    const fall = range("2026-10-29", 5);
    expect(run(fall, new Date("2026-11-02T10:00:00-05:00"), NY).current).toBe(5);
  });

  it("works in a DST-free zone with a half-hour offset", () => {
    const dates = range("2026-06-01", 3);
    const kolkata = new Date("2026-06-03T23:45:00+05:30");
    expect(run(dates, kolkata, "Asia/Kolkata").current).toBe(3);
  });
});

describe("helpers", () => {
  it("numbers journal days and unlocks emotion depth gradually", () => {
    expect(journalDayNumber(null, "2026-01-01")).toBe(1);
    expect(journalDayNumber("2026-01-01", "2026-01-01")).toBe(1);
    expect(journalDayNumber("2026-01-01", "2026-01-08")).toBe(8);
    expect(emotionDepthForDay(1)).toBe(1);
    expect(emotionDepthForDay(7)).toBe(1);
    expect(emotionDepthForDay(8)).toBe(2);
    expect(emotionDepthForDay(21)).toBe(2);
    expect(emotionDepthForDay(22)).toBe(3);
    expect(emotionDepthForDay(1, 3)).toBe(3);
  });
});
