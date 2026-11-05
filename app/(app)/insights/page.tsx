import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/data/profile";
import { entriesInRange } from "@/lib/data/entries";
import { getStreak } from "@/lib/data/streaks";
import { listTags } from "@/lib/data/tags";
import { addDays, addMonths, formatDate, localDate, startOfMonth, startOfWeek } from "@/lib/dates";
import { getDict, fmt } from "@/lib/i18n";
import { CHART_ORDER, dayOfWeekPattern, emotionTrends, recap, triggers } from "@/lib/insights";
import { breadcrumb, getCore } from "@/lib/emotions";
import { tagLabel } from "@/lib/tags";
import { isUnlocked } from "@/lib/rewards";
import { features } from "@/lib/env";
import { TrendsChart, WeekdayChart } from "@/components/charts/lazy-charts";
import { buttonClass } from "@/components/ui/button";
import { ReflectCard } from "./reflect-card";

export const metadata: Metadata = { title: "Insights" };

function Card({
  title,
  hint,
  children,
  id,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id ?? title}-h`}
      className="border-border bg-surface space-y-3 rounded-2xl border p-5"
    >
      <div>
        <h2 id={`${id ?? title}-h`} className="text-lg font-semibold">
          {title}
        </h2>
        {hint && <p className="text-muted text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function InsightsPage() {
  const profile = await getProfile();
  const lang = profile.language;
  const t = getDict(lang);
  const today = localDate(new Date(), profile.timezone);
  const [entries, streak, tags] = await Promise.all([
    entriesInRange(addDays(today, -365), today),
    getStreak(),
    listTags(),
  ]);
  const tagName = (id: string) => tagLabel(tags.find((x) => x.id === id)?.name ?? "", lang);

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl font-semibold">{t.insights.title}</h1>
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="text-muted">{t.insights.empty}</p>
          <Link href="/today" className={buttonClass("primary", "md", "mt-4")}>
            {t.entries.startWriting}
          </Link>
        </div>
      </div>
    );
  }

  const weekStart = startOfWeek(today);
  const weeks = emotionTrends(
    entries.filter((e) => e.date >= addDays(weekStart, -7 * 11)),
    "week",
  );
  const months = emotionTrends(
    entries.filter((e) => e.date >= startOfMonth(addMonths(today, -11))),
    "month",
  );
  const trig = triggers(entries.filter((e) => e.date >= addDays(today, -90))).slice(0, 6);
  const weekday = dayOfWeekPattern(entries.filter((e) => e.date >= addDays(today, -180)));
  const monthEntries = entries.filter((e) => e.date >= startOfMonth(today));
  const monthRecap = recap(
    monthEntries.length >= 3 ? monthEntries : entries.filter((e) => e.date >= addDays(today, -30)),
  );
  const recapUnlocked = isUnlocked("recap", streak.longest);
  const weekEntries = entries.filter((e) => e.date >= weekStart);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.insights.title}</h1>

      <Card title={t.insights.trends}>
        <TrendsChart weeks={weeks} months={months} lang={lang} t={t} />
      </Card>

      <Card title={t.insights.triggers} hint={t.insights.triggersHint}>
        {trig.length === 0 ? (
          <p className="text-muted text-sm">{t.insights.empty}</p>
        ) : (
          <ul className="space-y-3">
            {trig.map((row) => (
              <li key={row.tagId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{tagName(row.tagId)}</span>
                  <span className="text-muted tabular-nums">{row.total}</span>
                </div>
                <div className="flex h-3 gap-[2px] overflow-hidden rounded-full" aria-hidden>
                  {CHART_ORDER.filter((c) => row[c] > 0).map((c) => (
                    <span
                      key={c}
                      style={{ flexGrow: row[c], background: getCore(c).color }}
                      title={`${getCore(c).label[lang]}: ${row[c]}`}
                    />
                  ))}
                </div>
                <p className="text-muted mt-1 text-xs">
                  {CHART_ORDER.filter((c) => row[c] > 0)
                    .sort((a, b) => row[b] - row[a])
                    .map((c) => `${getCore(c).label[lang]} ${row[c]}`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t.insights.dayOfWeek} hint={t.insights.dayOfWeekHint}>
        <WeekdayChart data={weekday} lang={lang} t={t} />
      </Card>

      <Card title={t.insights.recap} id="recap">
        {!recapUnlocked ? (
          <p className="text-muted text-sm">{t.insights.recapLocked}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2" data-testid="recap">
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">{t.insights.mostCommon}</h3>
              <ul className="space-y-1">
                {monthRecap.mostCommon.map((m) => (
                  <li key={m.key} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: getCore(m.emotion.core).color }}
                    />
                    {breadcrumb(m.emotion, lang).join(" › ")}
                    <span className="text-muted ms-auto tabular-nums">{m.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">{t.insights.strongestDays}</h3>
              <ul className="space-y-1">
                {monthRecap.strongestDays.map((d) => (
                  <li key={d.date} className="text-sm">
                    <Link href={`/entry/${d.date}`} className="underline-offset-4 hover:underline">
                      {formatDate(d.date, lang, { weekday: undefined })}
                    </Link>{" "}
                    · {breadcrumb(d.emotion, lang).join(" › ")} {d.emotion.intensity}/5
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">{t.insights.lifted}</h3>
              <p className="text-sm">
                {monthRecap.lifted.map((x) => tagName(x.tagId)).join(", ") || "·"}
              </p>
            </div>
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">{t.insights.drained}</h3>
              <p className="text-sm">
                {monthRecap.drained.map((x) => tagName(x.tagId)).join(", ") || "·"}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card title={t.insights.weeklyReview}>
        <p className="font-serif text-lg" dir="auto">
          {t.insights.weeklyPrompt}
        </p>
        <p className="text-muted text-sm">
          {fmt(t.common.words, { n: weekEntries.reduce((a, e) => a + e.wordCount, 0) })} ·{" "}
          {weekEntries.length} {t.common.days}
        </p>
        <ReflectCard
          t={t}
          enabled={profile.aiReflectionEnabled && features.aiReflectionAvailable()}
          hasEntries={weekEntries.length > 0}
        />
      </Card>

      <Card title={t.insights.export} hint={t.insights.exportHint}>
        <div className="flex flex-wrap gap-2">
          <Link href="/print/summary?period=week" className={buttonClass("secondary", "md")}>
            {t.insights.exportWeek}
          </Link>
          <Link href="/print/summary?period=month" className={buttonClass("secondary", "md")}>
            {t.insights.exportMonth}
          </Link>
        </div>
      </Card>
    </div>
  );
}
