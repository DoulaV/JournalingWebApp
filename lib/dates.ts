// Date helpers. Calendar dates are plain "YYYY-MM-DD" strings so they never
// shift with timezones or daylight saving. Instants are converted to a calendar
// date in the user's timezone with Intl.

export type DateStr = string; // "YYYY-MM-DD"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateStr(v: unknown): v is DateStr {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parts(now: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) out[p.type] = p.value;
  return {
    date: `${out.year}-${out.month}-${out.day}`,
    hour: Number(out.hour),
    minute: Number(out.minute),
  };
}

/** The calendar date of `now` in `timeZone`. */
export function localDate(now: Date, timeZone: string): DateStr {
  return parts(now, timeZone).date;
}

/** Minutes since local midnight of `now` in `timeZone`. */
export function localMinutes(now: Date, timeZone: string): number {
  const p = parts(now, timeZone);
  return p.hour * 60 + p.minute;
}

export function localHour(now: Date, timeZone: string): number {
  return parts(now, timeZone).hour;
}

function toUtc(d: DateStr): number {
  return Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
}

function fromUtc(ms: number): DateStr {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: DateStr, n: number): DateStr {
  return fromUtc(toUtc(d) + n * 86_400_000);
}

export function addMonths(d: DateStr, n: number): DateStr {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7)) - 1 + n;
  const day = Number(d.slice(8, 10));
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return fromUtc(target.getTime());
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: DateStr, b: DateStr): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

export function compareDates(a: DateStr, b: DateStr): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(d: DateStr): number {
  return new Date(toUtc(d)).getUTCDay();
}

/** Monday of the week containing `d`. */
export function startOfWeek(d: DateStr): DateStr {
  const dow = dayOfWeek(d);
  return addDays(d, -((dow + 6) % 7));
}

export function startOfMonth(d: DateStr): DateStr {
  return `${d.slice(0, 7)}-01`;
}

export function endOfMonth(d: DateStr): DateStr {
  return addDays(addMonths(startOfMonth(d), 1), -1);
}

export function daysInRange(from: DateStr, to: DateStr): DateStr[] {
  const out: DateStr[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "HH:MM" or "HH:MM:SS" to minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatDate(d: DateStr, lang: "en" | "ar", opts: Intl.DateTimeFormatOptions = {}): string {
  const locale = lang === "ar" ? "ar-AE" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...opts,
  }).format(new Date(toUtc(d)));
}

/** Grace period: until 12:00 local time, yesterday can still be written. */
export const GRACE_HOUR = 12;

export function isWithinGrace(now: Date, timeZone: string): boolean {
  return localHour(now, timeZone) < GRACE_HOUR;
}
