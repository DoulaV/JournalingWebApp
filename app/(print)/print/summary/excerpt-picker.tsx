"use client";

import { useState } from "react";

export function ExcerptPicker({ entries, title, hint }: { entries: { date: string; label: string; text: string }[]; title: string; hint: string }) {
  const [chosen, setChosen] = useState<string[]>([]);
  return (
    <section>
      <h2 className="mb-1 font-semibold">{title}</h2>
      <p className="no-print mb-3 text-sm text-muted">{hint}</p>
      <ul className="space-y-3">
        {entries.map((e) => {
          const on = chosen.includes(e.date);
          return (
            <li key={e.date} className={on ? "" : "no-print opacity-60"}>
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  className="no-print mt-1 size-5 accent-[var(--accent)]"
                  checked={on}
                  onChange={() => setChosen((c) => (on ? c.filter((d) => d !== e.date) : [...c, e.date]))}
                />
                <span>
                  <span className="block text-sm font-medium">{e.label}</span>
                  <span className="block font-serif" dir="auto">
                    {e.text}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
