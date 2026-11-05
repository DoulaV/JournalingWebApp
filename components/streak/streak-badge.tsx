import type { StreakSummary } from "@/lib/data/streaks";
import { fmt, type Dict } from "@/lib/i18n";
import { nextMilestone } from "@/lib/streak";

export function StreakBadge({ streak, t }: { streak: StreakSummary; t: Dict["streak"] }) {
  const days = (n: number) => (n === 1 ? t.oneDay : fmt(t.days, { n }));
  const next = nextMilestone(streak.current);
  return (
    <section aria-label={t.current} className="rounded-2xl border border-border bg-surface p-4" data-testid="streak">
      <div>
        <p className="text-sm text-muted">{t.current}</p>
        <p className="text-2xl font-semibold" data-testid="streak-current">
          {days(streak.current)}
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
          <div>
            <dt className="text-muted">{t.longest}</dt>
            <dd className="font-medium" data-testid="streak-longest">{streak.longest}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.total}</dt>
            <dd className="font-medium" data-testid="streak-total">{streak.total}</dd>
          </div>
          <div title={t.freezesHint}>
            <dt className="text-muted">{t.freezes}</dt>
            <dd className="font-medium" aria-describedby="freeze-hint">
              {streak.freezes}
            </dd>
          </div>
        </dl>
      </div>
      <p id="freeze-hint" className="sr-only">{t.freezesHint}</p>
      {streak.atRisk ? (
        <p className="mt-3 text-sm">{t.atRisk}</p>
      ) : (
        next && streak.current > 0 && <p className="mt-2 text-sm text-muted">{fmt(t.nextMilestone, { n: next - streak.current })}</p>
      )}
    </section>
  );
}
