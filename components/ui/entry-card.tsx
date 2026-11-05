import Link from "next/link";
import type { Entry } from "@/lib/data/types";
import { formatDate } from "@/lib/dates";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/emotions";
import { EmotionDots } from "./emotion-dots";
import { firstLine } from "@/lib/data/entry-utils";

export function EntryCard({ entry, lang, t }: { entry: Entry; lang: Lang; t: Dict }) {
  const preview = firstLine(entry.bodyText);
  return (
    <Link
      href={`/entry/${entry.date}`}
      className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2"
      data-testid="entry-card"
    >
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>{formatDate(entry.date, lang)}</span>
        <EmotionDots emotions={entry.emotions} />
      </div>
      {entry.title && (
        <p className="mt-1 font-serif text-lg font-semibold" dir="auto">
          {entry.title}
        </p>
      )}
      <p className="mt-1 line-clamp-2 font-serif" dir="auto">
        {preview || t.entries.noText}
      </p>
    </Link>
  );
}
