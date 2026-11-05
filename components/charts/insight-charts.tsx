"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCore, type CoreId, type Lang } from "@/lib/emotions";
import { CHART_ORDER } from "@/lib/insights";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type TrendRow = { period: string } & Record<CoreId, number>;

function periodLabel(p: string, bucket: "week" | "month", lang: Lang) {
  const d = new Date(`${p}T00:00:00Z`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", {
    timeZone: "UTC",
    ...(bucket === "week" ? { day: "numeric", month: "short" } : { month: "short" }),
  }).format(d);
}

const axis = { fontSize: 12, fill: "var(--muted)" };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value > 0);
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="mb-1 font-medium">{label}</p>
      {items.length === 0 ? (
        <p className="text-muted">0</p>
      ) : (
        items.map((p) => (
          <p key={p.name} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="ms-auto ps-3 tabular-nums">{p.value}</span>
          </p>
        ))
      )}
    </div>
  );
}

export function TrendsChart({
  weeks,
  months,
  lang,
  t,
}: {
  weeks: TrendRow[];
  months: TrendRow[];
  lang: Lang;
  t: Dict;
}) {
  const [bucket, setBucket] = useState<"week" | "month">("week");
  const rows = (bucket === "week" ? weeks : months).map((r) => ({ ...r, label: periodLabel(r.period, bucket, lang) }));
  const present = CHART_ORDER.filter((c) => rows.some((r) => r[c] > 0));

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-full border border-border p-1 text-sm" role="group" aria-label={t.insights.trends}>
        {(["week", "month"] as const).map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={bucket === b}
            onClick={() => setBucket(b)}
            className={cn("min-h-9 flex-1 rounded-full px-3", bucket === b ? "bg-accent-soft font-medium" : "text-muted")}
          >
            {b === "week" ? t.insights.weeks : t.insights.months}
          </button>
        ))}
      </div>
      <div className="h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval="preserveStartEnd" />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => <span style={{ color: "var(--text)" }}>{value}</span>}
            />
            {present.map((c, i) => (
              <Bar
                key={c}
                dataKey={c}
                name={getCore(c).label[lang]}
                stackId="a"
                fill={getCore(c).color}
                stroke="var(--surface)"
                strokeWidth={2}
                radius={i === present.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="min-h-9 cursor-pointer text-muted">{lang === "ar" ? "عرض كجدول" : "Show as table"}</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="text-muted">
                <th className="py-1 pe-2 text-start font-medium">{bucket === "week" ? t.insights.weeks : t.insights.months}</th>
                {present.map((c) => (
                  <th key={c} className="px-1 py-1 text-end font-medium">
                    {getCore(c).label[lang]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period} className="border-t border-border">
                  <td className="py-1 pe-2">{r.label}</td>
                  {present.map((c) => (
                    <td key={c} className="px-1 py-1 text-end tabular-nums">
                      {r[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function WeekdayChart({ data, lang, t }: { data: { weekday: number; average: number | null; count: number }[]; lang: Lang; t: Dict }) {
  const names = data.map((d) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar-AE" : "en-GB", { timeZone: "UTC", weekday: "short" }).format(
      new Date(Date.UTC(2024, 0, 1 + d.weekday)),
    ),
  );
  const rows = data.map((d, i) => ({ label: names[i], value: d.average ?? 0, count: d.count }));
  return (
    <div className="h-56" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis domain={[0, 5]} ticks={[1, 3, 5]} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-sm">
                  <p className="font-medium">{label}</p>
                  <p>
                    {t.insights.pleasantness}: {Number(payload[0].value).toFixed(1)} / 5
                  </p>
                  <p className="text-muted">{(payload[0].payload as { count: number }).count} ×</p>
                </div>
              ) : null
            }
          />
          <Bar dataKey="value" name={t.insights.pleasantness} fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
