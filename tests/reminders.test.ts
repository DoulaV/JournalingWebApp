import { describe, expect, it } from "vitest";
import { decideNotification, pickCopy, type ReminderSettings, type SentState } from "@/lib/reminders";

const settings: ReminderSettings = {
  timeZone: "Asia/Dubai",
  remindersEnabled: true,
  reminderTime: "21:30",
  nudgeEnabled: true,
  nudgeTime: "23:00",
  morningReminderEnabled: false,
  morningReminderTime: "08:00",
};
const none: SentState = { sentOn: null, sentCount: 0, sentKinds: null };
const at = (time: string, date = "2026-03-10") => new Date(`${date}T${time}:00+04:00`);

describe("reminders", () => {
  it("sends nothing before the reminder time", () => {
    expect(decideNotification({ now: at("21:00"), settings, sent: none, wroteToday: false })).toBeNull();
  });

  it("sends the reminder at its time, in the user's timezone", () => {
    const d = decideNotification({ now: at("21:31"), settings, sent: none, wroteToday: false });
    expect(d?.kind).toBe("reminder");
    expect(d?.nextSent).toEqual({ sentOn: "2026-03-10", sentCount: 1, sentKinds: "reminder" });
  });

  it("tolerates a late cron run inside the window, but not hours later", () => {
    expect(decideNotification({ now: at("22:45"), settings: { ...settings, nudgeEnabled: false }, sent: none, wroteToday: false })?.kind).toBe(
      "reminder",
    );
    expect(decideNotification({ now: at("23:45"), settings: { ...settings, nudgeEnabled: false }, sent: none, wroteToday: false })).toBeNull();
  });

  it("does not send the same reminder twice", () => {
    const sent = { sentOn: "2026-03-10", sentCount: 1, sentKinds: "reminder" };
    expect(decideNotification({ now: at("21:45"), settings, sent, wroteToday: false })).toBeNull();
  });

  it("sends one follow-up nudge only if nothing is written", () => {
    const sent = { sentOn: "2026-03-10", sentCount: 1, sentKinds: "reminder" };
    expect(decideNotification({ now: at("23:05"), settings, sent, wroteToday: false })?.kind).toBe("nudge");
    expect(decideNotification({ now: at("23:05"), settings, sent, wroteToday: true })).toBeNull();
    const after = { sentOn: "2026-03-10", sentCount: 2, sentKinds: "reminder,nudge" };
    expect(decideNotification({ now: at("23:20"), settings, sent: after, wroteToday: false })).toBeNull();
  });

  it("never sends more than 2 a day", () => {
    const s = { ...settings, morningReminderEnabled: true };
    const sent = { sentOn: "2026-03-10", sentCount: 2, sentKinds: "morning,reminder" };
    expect(decideNotification({ now: at("23:05"), settings: s, sent, wroteToday: false })).toBeNull();
  });

  it("resets the count on a new local day", () => {
    const sent = { sentOn: "2026-03-09", sentCount: 2, sentKinds: "reminder,nudge" };
    expect(decideNotification({ now: at("21:31"), settings, sent, wroteToday: false })?.kind).toBe("reminder");
  });

  it("sends the morning intention reminder when enabled", () => {
    const s = { ...settings, morningReminderEnabled: true };
    expect(decideNotification({ now: at("08:10"), settings: s, sent: none, wroteToday: false })?.kind).toBe("morning");
  });

  it("stays quiet when reminders are off", () => {
    const s = { ...settings, remindersEnabled: false };
    expect(decideNotification({ now: at("21:31"), settings: s, sent: none, wroteToday: false })).toBeNull();
    expect(decideNotification({ now: at("23:05"), settings: s, sent: none, wroteToday: false })).toBeNull();
  });

  it("tells you when a letter opens, even if you have written", () => {
    expect(decideNotification({ now: at("10:00"), settings, sent: none, wroteToday: true, letterReady: true })?.kind).toBe("letter");
  });

  it("uses local time in a DST zone", () => {
    const s = { ...settings, timeZone: "America/New_York" };
    // 21:31 EDT on 2026-03-10 is 01:31Z on 2026-03-11.
    const d = decideNotification({ now: new Date("2026-03-11T01:31:00Z"), settings: s, sent: none, wroteToday: false });
    expect(d?.kind).toBe("reminder");
    expect(d?.today).toBe("2026-03-10");
  });

  it("rotates copy by day", () => {
    const list = ["a", "b", "c"];
    expect(pickCopy(list, "2026-03-10")).not.toBe(pickCopy(list, "2026-03-11"));
  });
});
