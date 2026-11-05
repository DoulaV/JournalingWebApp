import type { Metadata } from "next";
import { getProfile } from "@/lib/data/profile";
import { entriesInRange } from "@/lib/data/entries";
import { addDays, formatDate, localDate, startOfMonth, startOfWeek } from "@/lib/dates";
import { getDict } from "@/lib/i18n";
import { CHART_ORDER, dayPleasantness, recap } from "@/lib/insights";
import { breadcrumb, getCore } from "@/lib/emotions";
import { PrintButton } from "@/components/ui/print-button";
import { ExcerptPicker } from "./excerpt-picker";

export const metadata: Metadata = { title: "Summary" };

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period } = await searchParams;
  const profile = await getProfile();
  const lang = profile.language;
  const t = getDict(lang);
  const today = localDate(new Date(), profile.timezone);
  const monthly = period === "month";
  const from = monthly ? startOfMonth(today) : startOfWeek(today);
  const entries = await entriesInRange(from, today);
  const r = recap(entries);

  const byCore = CHART_ORDER.map((c) => {
    const list = entries.flatMap((e) => e.emotions.filter((em) => em.core === c));
    return { core: c, count: list.length, avg: list.length ? list.reduce((a, b) => a + b.intensity, 0) / list.length : 0 };
  }).filter((x) => x.count > 0);
  const moods = entries.map(dayPleasantness).filter((x): x is number => x != null);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const ar = lang === "ar";

  return (
    <div className="text-[15px]" data-testid="summary">
      <PrintButton label={t.settings.exportPdf} backLabel={t.common.back} />
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold">{t.insights.export}</h1>
        <p className="text-muted">
          {formatDate(from, lang, { year: "numeric" })} · {formatDate(today, lang, { year: "numeric" })} · {entries.length} {t.common.days}
          {avgMood != null && ` · ${t.insights.pleasantness} ${avgMood.toFixed(1)}/5`}
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold">{ar ? "المشاعر وشدتها" : "Feelings and intensity"}</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-1 text-start font-medium">{t.search.core}</th>
              <th className="py-1 text-end font-medium">{ar ? "المرات" : "Times"}</th>
              <th className="py-1 text-end font-medium">{ar ? "متوسط الشدة" : "Average intensity"}</th>
            </tr>
          </thead>
          <tbody>
            {byCore.map((x) => (
              <tr key={x.core} className="border-b border-border">
                <td className="py-1">
                  <span aria-hidden className="me-2 inline-block size-2.5 rounded-full" style={{ background: getCore(x.core).color }} />
                  {getCore(x.core).label[lang]}
                </td>
                <td className="py-1 text-end tabular-nums">{x.count}</td>
                <td className="py-1 text-end tabular-nums">{x.avg.toFixed(1)} / 5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-semibold">{t.insights.mostCommon}</h2>
          <ul className="text-sm">
            {r.mostCommon.map((m) => (
              <li key={m.key}>
                {breadcrumb(m.emotion, lang).join(" › ")} ({m.count})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">{t.insights.strongestDays}</h2>
          <ul className="text-sm">
            {r.strongestDays.map((d) => (
              <li key={d.date}>
                {formatDate(d.date, lang, { weekday: "short" })}: {breadcrumb(d.emotion, lang).join(" › ")} {d.emotion.intensity}/5
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ExcerptPicker
        entries={entries.map((e) => ({ date: e.date, label: formatDate(e.date, lang, { weekday: "short" }), text: e.bodyText.slice(0, 600) }))}
        title={ar ? "مقتطفات اخترتها" : "Excerpts I chose"}
        hint={ar ? "اختر المقتطفات التي تريد مشاركتها. غير المختار لن يُطبع." : "Choose excerpts to include. Anything unchecked is left out of the printout."}
      />
      <p className="mt-8 text-xs text-muted">{addDays(today, 0)}</p>
    </div>
  );
}
