import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEntryByDate } from "@/lib/data/entries";
import { getProfile } from "@/lib/data/profile";
import { listTags } from "@/lib/data/tags";
import { signAttachments } from "@/lib/data/attachments";
import { addDays, formatDate, isDateStr, localDate } from "@/lib/dates";
import { getDict } from "@/lib/i18n";
import { tagLabel } from "@/lib/tags";
import { buttonClass } from "@/components/ui/button";
import { EntryView } from "./entry-view";

export const metadata: Metadata = { title: "Entry" };

export default async function EntryPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isDateStr(date)) notFound();
  const profile = await getProfile();
  const t = getDict(profile.language);
  const today = localDate(new Date(), profile.timezone);
  if (date === today) redirect("/today");

  const [raw, tags] = await Promise.all([getEntryByDate(date), listTags()]);
  const entry = raw ? (await signAttachments([raw]))[0] : null;
  const lang = profile.language;

  return (
    <div className="space-y-6">
      <nav className="no-print flex items-center justify-between text-sm" aria-label="day">
        <Link
          href={`/entry/${addDays(date, -1)}`}
          className="hover:bg-surface-2 flex min-h-10 items-center rounded-full px-3"
        >
          <span aria-hidden className="inline-block rtl:rotate-180">
            ←
          </span>
          &nbsp;{t.calendar.prev}
        </Link>
        {addDays(date, 1) <= today && (
          <Link
            href={addDays(date, 1) === today ? "/today" : `/entry/${addDays(date, 1)}`}
            className="hover:bg-surface-2 flex min-h-10 items-center rounded-full px-3"
          >
            {t.calendar.next}&nbsp;
            <span aria-hidden className="inline-block rtl:rotate-180">
              →
            </span>
          </Link>
        )}
      </nav>
      <header>
        <h1 className="font-serif text-3xl font-semibold">{formatDate(date, lang)}</h1>
        {entry?.isBackfilled && <p className="text-muted mt-1 text-sm">{t.entries.backfilled}</p>}
        {entry && entry.tagIds.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.search.tag}>
            {tags
              .filter((tg) => entry.tagIds.includes(tg.id))
              .map((tg) => (
                <li key={tg.id} className="border-border rounded-full border px-3 py-1 text-sm">
                  {tagLabel(tg.name, lang)}
                </li>
              ))}
          </ul>
        )}
      </header>
      {entry ? (
        <EntryView entry={entry} lang={lang} t={t} fontSize={profile.fontSize} />
      ) : (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="text-muted">{t.entries.nothingThisDay}</p>
          <Link href="/today" className={buttonClass("secondary", "md", "mt-4")}>
            {t.errors.goToday}
          </Link>
        </div>
      )}
    </div>
  );
}
