import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/data/profile";
import { getStreak } from "@/lib/data/streaks";
import { lettersOverview } from "@/lib/data/letters";
import { addDays, formatDate, localDate } from "@/lib/dates";
import { fmt, getDict } from "@/lib/i18n";
import { isUnlocked } from "@/lib/rewards";
import { LetterForm } from "./letter-form";

export const metadata: Metadata = { title: "Letters" };

export default async function LettersPage() {
  const [profile, streak] = await Promise.all([getProfile(), getStreak()]);
  const lang = profile.language;
  const t = getDict(lang);
  const unlocked = isUnlocked("letters", streak.longest);
  const letters = await lettersOverview();
  const today = localDate(new Date(), profile.timezone);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.letters.title}</h1>
      {!unlocked && letters.length === 0 ? (
        <p className="border-border text-muted rounded-2xl border border-dashed p-6 text-center">
          {t.letters.locked}
        </p>
      ) : (
        <>
          {unlocked && (
            <LetterForm t={t} minDate={addDays(today, 1)} defaultDate={addDays(today, 365)} />
          )}
          {letters.length === 0 ? (
            <p className="text-muted">{t.letters.empty}</p>
          ) : (
            <ul className="space-y-3">
              {letters.map((l) => (
                <li
                  key={l.id}
                  className="border-border bg-surface rounded-2xl border p-4"
                  data-testid="letter"
                >
                  {l.isOpen ? (
                    <Link href={`/letters/${l.id}`} className="block">
                      <p className="font-medium" dir="auto">
                        {l.title || t.letters.ready}
                      </p>
                      <p className="text-muted text-sm">
                        {l.openedAt
                          ? fmt(t.letters.opened, {
                              date: formatDate(l.openedAt.slice(0, 10), lang, {
                                weekday: undefined,
                              }),
                            })
                          : t.letters.ready}
                      </p>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="text-xl">
                        ✉
                      </span>
                      <p className="text-sm">
                        {fmt(t.letters.sealed, {
                          date: formatDate(l.sealedUntil, lang, {
                            weekday: undefined,
                            year: "numeric",
                          }),
                        })}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
