import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/data/profile";
import { getStreak } from "@/lib/data/streaks";
import { entriesInRange, firstEntryDate, getEntryByDate } from "@/lib/data/entries";
import { addDays, formatDate, localDate } from "@/lib/dates";
import { fmt, getDict } from "@/lib/i18n";
import { REWARDS, isUnlocked, rewardLabel } from "@/lib/rewards";
import { MILESTONES } from "@/lib/streak";
import { recap } from "@/lib/insights";
import { breadcrumb, getCore } from "@/lib/emotions";
import { RenderDoc } from "@/components/editor/render-doc";
import { StreakBadge } from "@/components/streak/streak-badge";
import type { Entry } from "@/lib/data/types";

export const metadata: Metadata = { title: "Milestones" };

export default async function MilestonesPage() {
  const [profile, streak] = await Promise.all([getProfile(), getStreak()]);
  const lang = profile.language;
  const t = getDict(lang);
  const today = localDate(new Date(), profile.timezone);

  const lookBack = isUnlocked("lookBack", streak.longest);
  const yearReview = isUnlocked("yearReview", streak.longest);
  const first = lookBack ? await firstEntryDate() : null;
  const [dayOne, todayEntry] = lookBack && first ? await Promise.all([getEntryByDate(first), getEntryByDate(today)]) : [null, null];
  const year = yearReview ? await entriesInRange(addDays(today, -364), today) : [];
  const yearRecap = yearReview ? recap(year) : null;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.rewards.title}</h1>
      <StreakBadge streak={streak} t={t.streak} />

      <section aria-labelledby="unlocks" className="rounded-2xl border border-border bg-surface p-5">
        <h2 id="unlocks" className="mb-3 text-lg font-semibold">
          {t.rewards.title}
        </h2>
        <ul className="space-y-2">
          {MILESTONES.map((m) => {
            const reward = REWARDS.find((r) => r.at === m);
            const reached = streak.longest >= m;
            return (
              <li key={m} className="flex min-h-11 items-center gap-3">
                <span
                  aria-hidden
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${reached ? "bg-accent text-accent-text" : "bg-surface-2 text-muted"}`}
                >
                  {m}
                </span>
                <span className="flex-1">
                  {reward ? (
                    reached ? (
                      <Link href={reward.href} className="underline-offset-4 hover:underline">
                        {rewardLabel(reward.id, t.rewards)}
                      </Link>
                    ) : (
                      rewardLabel(reward.id, t.rewards)
                    )
                  ) : (
                    fmt(t.streak.milestone, { n: m })
                  )}
                </span>
                <span className="text-sm text-muted">{reached ? t.rewards.unlocked : fmt(t.rewards.unlockedAt, { n: m })}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {lookBack && (
        <section id="look-back" aria-labelledby="look-back-h" className="space-y-3">
          <h2 id="look-back-h" className="font-serif text-2xl font-semibold">
            {t.rewards.lookBack}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <SideEntry label={t.rewards.dayOne} entry={dayOne} lang={lang} t={t} />
            <SideEntry label={t.rewards.todayLabel} entry={todayEntry} lang={lang} t={t} />
          </div>
        </section>
      )}

      {yearRecap && (
        <section id="year" aria-labelledby="year-h" className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <h2 id="year-h" className="font-serif text-2xl font-semibold">
            {t.rewards.yearReview}
          </h2>
          <p>
            {year.length} {t.common.days} · {fmt(t.common.words, { n: year.reduce((a, e) => a + e.wordCount, 0) })}
          </p>
          <h3 className="text-sm font-medium text-muted">{t.insights.mostCommon}</h3>
          <ul className="space-y-1">
            {yearRecap.mostCommon.map((m) => (
              <li key={m.key} className="flex items-center gap-2 text-sm">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: getCore(m.emotion.core).color }} />
                {breadcrumb(m.emotion, lang).join(" › ")} <span className="ms-auto text-muted">{m.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SideEntry({ label, entry, lang, t }: { label: string; entry: Entry | null; lang: "en" | "ar"; t: ReturnType<typeof getDict> }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-medium text-muted">
        {label}
        {entry && ` · ${formatDate(entry.date, lang, { year: "numeric" })}`}
      </p>
      <div className="entry-prose mt-2">
        {entry ? <RenderDoc doc={entry.body} fallbackText={entry.bodyText} /> : <p className="text-muted">{t.entries.noText}</p>}
      </div>
    </article>
  );
}
