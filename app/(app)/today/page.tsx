import type { Metadata } from "next";
import Link from "next/link";
import { getProfileRow, toProfile } from "@/lib/data/profile";
import {
  firstEntryDate,
  getEntriesByDates,
  getEntryByDate,
  recentEmotionKeys,
} from "@/lib/data/entries";
import { getStreak, unseenMilestones } from "@/lib/data/streaks";
import { listTags } from "@/lib/data/tags";
import { promptForToday } from "@/lib/data/prompts";
import { readyLetterCount } from "@/lib/data/letters";
import { signAttachments } from "@/lib/data/attachments";
import { addDays, addMonths, dayOfWeek, formatDate, localHour } from "@/lib/dates";
import { emotionDepthForDay, journalDayNumber, streakClock } from "@/lib/streak";
import { getDict, fmt } from "@/lib/i18n";
import { StreakBadge } from "@/components/streak/streak-badge";
import { OnThisDay } from "@/components/today/on-this-day";
import { Celebration } from "@/components/streak/celebration";
import { TodayClient } from "./today-client";
import { buttonClass } from "@/components/ui/button";
import { WEEKLY_REVIEW_PROMPT } from "@/lib/prompts";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const sp = await searchParams;
  const row = await getProfileRow();
  const profile = toProfile(row);
  const lang = profile.language;
  const t = getDict(lang);
  const now = new Date();
  const { today, yesterday, graceOpen } = streakClock(now, profile.timezone);
  const hour = localHour(now, profile.timezone);

  const [todayEntry, yesterdayEntry, streak, first, recents, tags, milestones, letters] =
    await Promise.all([
      getEntryByDate(today),
      graceOpen ? getEntryByDate(yesterday) : Promise.resolve(null),
      getStreak(),
      firstEntryDate(),
      recentEmotionKeys(5),
      listTags(),
      unseenMilestones(),
      readyLetterCount(),
    ]);

  // Stays in yesterday mode after saving, so the confirmation and the entry remain on screen.
  const backfilling = sp.for === "yesterday" && graceOpen;
  const date = backfilling ? yesterday : today;
  const canBackfill = graceOpen && !yesterdayEntry && !backfilling;
  const depth = emotionDepthForDay(journalDayNumber(first, today), profile.emotionDepthUnlocked);
  const pastDates = [
    addDays(today, -7),
    addMonths(today, -1),
    addMonths(today, -6),
    addMonths(today, -12),
  ];

  // Second batch, also in parallel.
  const [signed, prompt, past] = await Promise.all([
    backfilling
      ? yesterdayEntry
        ? signAttachments([yesterdayEntry])
        : Promise.resolve([null])
      : todayEntry
        ? signAttachments([todayEntry])
        : Promise.resolve([null]),
    todayEntry && !backfilling ? promptForToday() : Promise.resolve(null),
    getEntriesByDates(pastDates),
  ]);
  const entry = signed[0];

  const greeting =
    hour < 12
      ? t.today.greetingMorning
      : hour < 17
        ? t.today.greetingAfternoon
        : t.today.greetingEvening;
  const suggestedRitual = hour < 12 ? "morning" : hour >= 17 ? "evening" : null;
  const isFriday = dayOfWeek(today) === 5;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted text-sm">{formatDate(date, lang)}</p>
        <h1 className="font-serif text-3xl font-semibold">
          {profile.displayName ? `${greeting}, ${profile.displayName}` : greeting}
        </h1>
      </header>

      {backfilling && (
        <div
          className="bg-accent-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
          data-testid="backfill-banner"
        >
          <div>
            <p className="font-medium">{t.today.writingForYesterday}</p>
            <p className="text-muted text-sm">
              {fmt(t.today.writingFor, { date: formatDate(date, lang) })}
            </p>
          </div>
          <Link href="/today" className={buttonClass("secondary", "md")}>
            {t.today.backToToday}
          </Link>
        </div>
      )}

      {milestones.length > 0 && <Celebration milestone={Math.max(...milestones)} lang={lang} />}

      {canBackfill && (
        <div className="bg-surface-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div>
            <p className="font-medium">{t.today.backfillTitle}</p>
            <p className="text-muted text-sm">{t.today.backfillHint}</p>
          </div>
          <Link href="/today?for=yesterday" className={buttonClass("secondary", "md")}>
            {t.today.backfillCta}
          </Link>
        </div>
      )}

      {letters > 0 && (
        <div className="bg-accent-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="font-medium">{t.today.lettersReady}</p>
          <Link href="/letters" className={buttonClass("primary", "md")}>
            {t.today.openLetter}
          </Link>
        </div>
      )}

      <TodayClient
        key={date}
        date={date}
        lang={lang}
        t={t}
        entry={entry}
        depth={depth}
        recents={recents}
        tags={tags}
        bodyCheck={profile.bodyCheckEnabled}
        fontSize={profile.fontSize}
        prompt={prompt ? { id: prompt.id, text: prompt[lang] } : null}
        showPrompts={profile.showPrompts}
        suggestedRitual={backfilling ? null : suggestedRitual}
        weeklyPrompt={isFriday && !backfilling ? WEEKLY_REVIEW_PROMPT[lang] : null}
        isBackfill={backfilling}
      />

      {profile.showStreak && (
        <Link href="/milestones" className="block rounded-2xl">
          <StreakBadge streak={streak} t={t.streak} />
        </Link>
      )}

      <OnThisDay entries={past} today={today} lang={lang} t={t} />
    </div>
  );
}
