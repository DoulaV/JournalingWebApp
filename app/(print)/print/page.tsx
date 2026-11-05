import type { Metadata } from "next";
import { getProfile } from "@/lib/data/profile";
import { entriesInRange } from "@/lib/data/entries";
import { listTags } from "@/lib/data/tags";
import { addDays, formatDate, isDateStr, localDate } from "@/lib/dates";
import { getDict } from "@/lib/i18n";
import { breadcrumb } from "@/lib/emotions";
import { tagLabel } from "@/lib/tags";
import { RenderDoc } from "@/components/editor/render-doc";
import { PrintButton } from "@/components/ui/print-button";

export const metadata: Metadata = { title: "Print" };

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const profile = await getProfile();
  const lang = profile.language;
  const t = getDict(lang);
  const today = localDate(new Date(), profile.timezone);
  const from = isDateStr(sp.date) ? sp.date : isDateStr(sp.from) ? sp.from : addDays(today, -29);
  const to = isDateStr(sp.date) ? sp.date : isDateStr(sp.to) ? sp.to : today;
  const [entries, tags] = await Promise.all([entriesInRange(from, to), listTags()]);

  return (
    <div>
      <PrintButton label={t.settings.exportPdf} backLabel={t.common.back} />
      <h1 className="mb-1 font-serif text-3xl font-semibold">{t.appName}</h1>
      <p className="text-muted mb-8">
        {formatDate(from, lang, { year: "numeric" })} · {formatDate(to, lang, { year: "numeric" })}
      </p>
      {entries.length === 0 && <p className="text-muted">{t.entries.empty}</p>}
      {entries.map((e) => (
        <article key={e.id} className="print-page border-border mb-10 border-b pb-8 last:border-0">
          <h2 className="font-serif text-2xl font-semibold">
            {formatDate(e.date, lang, { year: "numeric" })}
          </h2>
          <p className="text-muted mt-1 text-sm">
            {e.emotions
              .map((em) => `${breadcrumb(em, lang).join(" › ")} ${em.intensity}/5`)
              .join(" · ")}
            {e.tagIds.length > 0 &&
              ` · ${tags
                .filter((tg) => e.tagIds.includes(tg.id))
                .map((tg) => tagLabel(tg.name, lang))
                .join(", ")}`}
          </p>
          {e.title && (
            <h3 className="mt-3 font-serif text-xl" dir="auto">
              {e.title}
            </h3>
          )}
          <div className="entry-prose mt-3">
            <RenderDoc doc={e.body} fallbackText={e.bodyText} />
          </div>
        </article>
      ))}
    </div>
  );
}
