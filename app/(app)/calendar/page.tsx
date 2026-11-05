import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/data/profile";
import { entriesInRange } from "@/lib/data/entries";
import { addDays, addMonths, dayOfWeek, endOfMonth, localDate } from "@/lib/dates";
import { getDict } from "@/lib/i18n";
import { dayCell, intensityOpacity } from "@/lib/insights";
import { EMOTIONS, type Lang } from "@/lib/emotions";
import type { Entry } from "@/lib/data/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Calendar" };

function monthLabel(month: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", { timeZone: "UTC", ...opts }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
}

function weekdayNames(lang: Lang) {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", { timeZone: "UTC", weekday: "narrow" }).format(
      new Date(Date.UTC(2024, 0, 1 + i)),
    ),
  );
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; m?: string; y?: string }> }) {
  const sp = await searchParams;
  const profile = await getProfile();
  const lang = profile.language;
  const t = getDict(lang);
  const today = localDate(new Date(), profile.timezone);
  const view = sp.view === "year" ? "year" : "month";

  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : today.slice(0, 7);
  const year = /^\d{4}$/.test(sp.y ?? "") ? sp.y! : today.slice(0, 4);

  const from = view === "month" ? `${month}-01` : `${year}-01-01`;
  const to = view === "month" ? endOfMonth(`${month}-01`) : `${year}-12-31`;
  const entries = await entriesInRange(from, to);
  const byDate = new Map(entries.map((e) => [e.date, e]));

  const tab = (v: "month" | "year", label: string) => (
    <Link
      href={v === "month" ? `/calendar?m=${month}` : `/calendar?view=year&y=${year}`}
      aria-current={view === v ? "page" : undefined}
      className={cn("flex min-h-10 items-center rounded-full px-4 text-sm", view === v ? "bg-accent-soft font-medium" : "text-muted")}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold">{t.calendar.title}</h1>
        <div className="flex gap-1 rounded-full border border-border p-1">
          {tab("month", t.calendar.month)}
          {tab("year", t.calendar.year)}
        </div>
      </div>

      {view === "month" ? (
        <MonthView month={month} today={today} byDate={byDate} lang={lang} t={t} />
      ) : (
        <YearView year={year} today={today} byDate={byDate} lang={lang} t={t} />
      )}

      <section aria-label={t.calendar.legend} className="space-y-2">
        <p className="text-sm text-muted">{t.calendar.legend}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {EMOTIONS.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-full" style={{ background: c.color }} />
              {c.label[lang]}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Pager({ prev, next, label, t }: { prev: string; next: string | null; label: string; t: ReturnType<typeof getDict> }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={prev} className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t.calendar.prev}>
        <span aria-hidden className="inline-block rtl:rotate-180">←</span>
      </Link>
      <h2 className="text-lg font-semibold" aria-live="polite">
        {label}
      </h2>
      {next ? (
        <Link href={next} className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label={t.calendar.next}>
          <span aria-hidden className="inline-block rtl:rotate-180">→</span>
        </Link>
      ) : (
        <span className="min-w-11" />
      )}
    </div>
  );
}

function MonthView({
  month,
  today,
  byDate,
  lang,
  t,
}: {
  month: string;
  today: string;
  byDate: Map<string, Entry>;
  lang: Lang;
  t: ReturnType<typeof getDict>;
}) {
  const first = `${month}-01`;
  const last = endOfMonth(first);
  const lead = (dayOfWeek(first) + 6) % 7;
  const cells: (string | null)[] = [...Array(lead).fill(null)];
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  const prev = addMonths(first, -1).slice(0, 7);
  const next = addMonths(first, 1).slice(0, 7);

  return (
    <section className="space-y-3" data-testid="month-view">
      <Pager
        prev={`/calendar?m=${prev}`}
        next={next <= today.slice(0, 7) ? `/calendar?m=${next}` : null}
        label={monthLabel(month, lang)}
        t={t}
      />
      <div role="grid" aria-label={monthLabel(month, lang)} className="grid grid-cols-7 gap-1.5 text-center">
        {weekdayNames(lang).map((w, i) => (
          <div key={i} role="columnheader" className="pb-1 text-xs text-muted">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`x${i}`} />;
          const e = byDate.get(d);
          const cell = dayCell(e);
          const future = d > today;
          const href = d === today ? "/today" : `/entry/${d}`;
          const content = (
            <>
              <span
                aria-hidden
                className="absolute inset-1 rounded-xl"
                style={cell.color ? { background: cell.color, opacity: intensityOpacity(cell.intensity) } : undefined}
              />
              <span className={cn("relative text-sm", cell.hasEntry && "font-semibold", d === today && "underline underline-offset-4")}>
                {Number(d.slice(8))}
              </span>
            </>
          );
          const label = `${d}${e ? "" : `, ${t.calendar.noEntry}`}`;
          return future ? (
            <div key={d} role="gridcell" className="relative flex aspect-square items-center justify-center text-muted/50">
              {content}
            </div>
          ) : (
            <Link
              key={d}
              href={href}
              role="gridcell"
              aria-label={label}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-xl",
                !cell.hasEntry && "bg-surface-2/60 text-muted",
              )}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function YearView({
  year,
  today,
  byDate,
  lang,
  t,
}: {
  year: string;
  today: string;
  byDate: Map<string, Entry>;
  lang: Lang;
  t: ReturnType<typeof getDict>;
}) {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const count = [...byDate.keys()].length;
  return (
    <section className="space-y-4" data-testid="year-view">
      <Pager
        prev={`/calendar?view=year&y=${Number(year) - 1}`}
        next={Number(year) < Number(today.slice(0, 4)) ? `/calendar?view=year&y=${Number(year) + 1}` : null}
        label={`${year} · ${count} ${t.common.days}`}
        t={t}
      />
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((m) => {
          const first = `${m}-01`;
          const lead = (dayOfWeek(first) + 6) % 7;
          const days: (string | null)[] = [...Array(lead).fill(null)];
          for (let d = first; d <= endOfMonth(first); d = addDays(d, 1)) days.push(d);
          return (
            <div key={m}>
              <Link href={`/calendar?m=${m}`} className="mb-1 block text-sm font-medium hover:underline">
                {monthLabel(m, lang, { month: "short" })}
              </Link>
              <div className="grid grid-cols-7 gap-[3px]" aria-hidden>
                {days.map((d, i) => {
                  if (!d) return <span key={`x${i}`} />;
                  const cell = dayCell(byDate.get(d));
                  return (
                    <span
                      key={d}
                      title={d}
                      className={cn("aspect-square rounded-[3px]", !cell.hasEntry && (d > today ? "bg-transparent" : "bg-surface-2"))}
                      style={cell.color ? { background: cell.color, opacity: intensityOpacity(cell.intensity) } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted" aria-hidden>
        {t.calendar.lessIntense}
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="size-3 rounded-[3px] bg-accent" style={{ opacity: intensityOpacity(i) }} />
        ))}
        {t.calendar.moreIntense}
      </div>
    </section>
  );
}

