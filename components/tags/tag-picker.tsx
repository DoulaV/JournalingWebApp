"use client";

import { useState } from "react";
import type { Tag } from "@/lib/data/types";
import { createTagAction } from "@/app/(app)/actions";
import { tagLabel } from "@/lib/tags";
import type { Lang } from "@/lib/emotions";
import { cn } from "@/lib/cn";

export function TagPicker({
  tags,
  value,
  onChange,
  lang,
  label,
}: {
  tags: Tag[];
  value: string[];
  onChange: (ids: string[]) => void;
  lang: Lang;
  label: string;
}) {
  const [all, setAll] = useState(tags);
  const [draft, setDraft] = useState("");
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  async function add() {
    const name = draft.trim();
    if (!name) return;
    setDraft("");
    try {
      const tag = await createTagAction(name);
      setAll((a) => (a.some((t) => t.id === tag.id) ? a : [...a, tag]));
      if (!value.includes(tag.id)) onChange([...value, tag.id]);
    } catch {
      setDraft(name);
    }
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {all.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={value.includes(t.id)}
            onClick={() => toggle(t.id)}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm",
              value.includes(t.id) ? "border-accent bg-accent-soft font-medium" : "border-border bg-surface",
            )}
          >
            {tagLabel(t.name, lang)}
          </button>
        ))}
        <span className="inline-flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add();
              }
            }}
            aria-label={lang === "ar" ? "جانب جديد" : "New life area"}
            placeholder="+"
            dir="auto"
            className="min-h-10 w-24 rounded-full border border-dashed border-border bg-transparent px-3 text-sm"
          />
        </span>
      </div>
    </fieldset>
  );
}
