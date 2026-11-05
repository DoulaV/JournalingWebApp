import Link from "next/link";
import type { Entry } from "@/lib/data/types";
import { addDays, addMonths, formatDate } from "@/lib/dates";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/emotions";
import { EmotionDots } from "@/components/ui/emotion-dots";
import { firstLine } from "@/lib/data/entry-utils";

export function OnThisDay({ entries, today, lang, t }: { entries: Entry[]; today: string; lang: Lang; t: Dict }) {
  const labels: [string, string][] = [
    [addDays(today, -7), t.today.weekAgo],
    [addMonths(today, -1), t.today.monthAgo],
    [addMonths(today, -6), t.today.sixMonthsAgo],
    [addMonths(today, -12), t.today.yearAgo],
  ];
  const items = labels
    .map(([d, label]) => ({ label, entry: entries.find((e) => e.date === d) }))
    .filter((x): x is { label: string; entry: Entry } => Boolean(x.entry));
  if (!items.length) return null;
  return (
    <section aria-labelledby="otd-title" className="space-y-3">
      <h2 id="otd-title" className="text-sm font-medium text-muted">
        {t.today.onThisDay}
      </h2>
      <ul className="space-y-2">
        {items.map(({ label, entry }) => (
          <li key={entry.id}>
            <Link href={`/entry/${entry.date}`} className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
              <div className="flex items-center justify-between gap-2 text-sm text-muted">
                <span>
                  {label} · {formatDate(entry.date, lang, { weekday: undefined })}
                </span>
                <EmotionDots emotions={entry.emotions} />
              </div>
              <p className="mt-1 font-serif" dir="auto">
                {entry.title || firstLine(entry.bodyText) || t.entries.noText}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
