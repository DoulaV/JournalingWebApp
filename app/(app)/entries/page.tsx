import type { Metadata } from "next";
import Link from "next/link";
import { listEntries } from "@/lib/data/entries";
import { getProfile } from "@/lib/data/profile";
import { getDict } from "@/lib/i18n";
import { EntryCard } from "@/components/ui/entry-card";
import { buttonClass } from "@/components/ui/button";
import { isDateStr } from "@/lib/dates";

export const metadata: Metadata = { title: "Entries" };

const PAGE = 30;

export default async function EntriesPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { before } = await searchParams;
  const profile = await getProfile();
  const t = getDict(profile.language);
  const entries = await listEntries({ limit: PAGE + 1, before: isDateStr(before) ? before : undefined });
  const more = entries.length > PAGE;
  const shown = entries.slice(0, PAGE);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.entries.title}</h1>
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted">{t.entries.empty}</p>
          <Link href="/today" className={buttonClass("primary", "md", "mt-4")}>
            {t.entries.startWriting}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => (
            <li key={e.id}>
              <EntryCard entry={e} lang={profile.language} t={t} />
            </li>
          ))}
        </ul>
      )}
      {more && (
        <Link href={`/entries?before=${shown[shown.length - 1].date}`} className={buttonClass("secondary", "md")}>
          {t.entries.loadMore}
        </Link>
      )}
    </div>
  );
}
