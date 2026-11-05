"use client";

import { useState } from "react";
import {
  BODY_LOCATIONS,
  EMOTIONS,
  breadcrumb,
  emotionLabel,
  getCore,
  getMiddle,
  pathKey,
  type CoreId,
  type Lang,
} from "@/lib/emotions";
import type { EmotionInput } from "@/lib/data/types";
import { fmt, type Dict } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export interface PickerValue {
  emotions: EmotionInput[];
  moodValence: number | null;
}

interface Props {
  value: PickerValue;
  onChange: (v: PickerValue) => void;
  depth: 1 | 2 | 3;
  recents: EmotionInput[];
  lang: Lang;
  t: Dict["picker"];
  bodyCheck?: boolean;
}

type Step = { ring: "core" } | { ring: "middle"; core: CoreId } | { ring: "precise"; core: CoreId; middle: string };

const MAX = 3;

export function EmotionPicker({ value, onChange, depth, recents, lang, t, bodyCheck }: Props) {
  const [step, setStep] = useState<Step>({ ring: "core" });
  const [adding, setAdding] = useState(value.emotions.length === 0 && value.moodValence == null);
  const [notSure, setNotSure] = useState(value.moodValence != null && value.emotions.length === 0);
  const full = value.emotions.length >= MAX;

  function add(e: Omit<EmotionInput, "intensity">) {
    if (full) return;
    const key = pathKey(e);
    if (value.emotions.some((x) => pathKey(x) === key)) {
      setStep({ ring: "core" });
      setAdding(false);
      return;
    }
    onChange({ emotions: [...value.emotions, { ...e, intensity: 3 }], moodValence: value.moodValence });
    setStep({ ring: "core" });
    setAdding(false);
    setNotSure(false);
  }

  function pickCore(core: CoreId) {
    if (depth >= 2) setStep({ ring: "middle", core });
    else add({ core });
  }

  function pickMiddle(core: CoreId, middle: string) {
    if (depth >= 3) setStep({ ring: "precise", core, middle });
    else add({ core, middle });
  }

  function update(i: number, patch: Partial<EmotionInput>) {
    const next = value.emotions.map((e, j) => (j === i ? { ...e, ...patch } : e));
    onChange({ ...value, emotions: next });
  }

  function remove(i: number) {
    const next = value.emotions.filter((_, j) => j !== i);
    onChange({ ...value, emotions: next });
    if (next.length === 0) setAdding(true);
  }

  function back() {
    if (step.ring === "precise") setStep({ ring: "middle", core: step.core });
    else if (step.ring === "middle") setStep({ ring: "core" });
  }

  const crumbs =
    step.ring === "core" ? [] : breadcrumb({ core: step.core, middle: step.ring === "precise" ? step.middle : null }, lang);

  return (
    <div className="space-y-5">
      {value.emotions.length > 0 && (
        <section aria-label={t.chosen} className="space-y-3">
          {value.emotions.map((e, i) => {
            const color = getCore(e.core).color;
            const name = emotionLabel(e, lang);
            return (
              <div key={pathKey(e)} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span aria-hidden className="size-3 rounded-full" style={{ background: color }} />
                    {breadcrumb(e, lang).join(" › ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                    aria-label={fmt(t.remove, { name })}
                  >
                    <span aria-hidden>✕</span>
                  </button>
                </div>
                <label className="mt-3 block text-sm text-muted" htmlFor={`intensity-${i}`}>
                  {t.intensity}
                </label>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span>{t.mild}</span>
                  <input
                    id={`intensity-${i}`}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={e.intensity}
                    onChange={(ev) => update(i, { intensity: Number(ev.target.value) })}
                    className="h-11 flex-1"
                    style={{ accentColor: color }}
                    aria-valuetext={`${e.intensity} / 5`}
                  />
                  <span>{t.strong}</span>
                </div>
                {bodyCheck && (
                  <fieldset className="mt-3">
                    <legend className="text-sm text-muted">{t.bodyCheck}</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {BODY_LOCATIONS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          aria-pressed={e.bodyLocation === b.id}
                          onClick={() => update(i, { bodyLocation: e.bodyLocation === b.id ? null : b.id })}
                          className={cn(
                            "min-h-9 rounded-full border px-3 text-sm",
                            e.bodyLocation === b.id ? "border-accent bg-accent-soft" : "border-border",
                          )}
                        >
                          {b.label[lang]}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            );
          })}
          {!adding && !full && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="min-h-11 w-full rounded-2xl border border-dashed border-border text-sm text-muted hover:bg-surface-2"
            >
              + {t.addAnother}
            </button>
          )}
          {full && <p className="text-sm text-muted">{t.maxReached}</p>}
        </section>
      )}

      {notSure && value.emotions.length === 0 ? (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-medium">{t.notSureTitle}</h3>
          <label htmlFor="valence" className="sr-only">
            {t.valence}
          </label>
          <div className="mt-4 flex items-center gap-3 text-sm text-muted">
            <span>{t.unpleasant}</span>
            <input
              id="valence"
              type="range"
              min={1}
              max={5}
              step={1}
              value={value.moodValence ?? 3}
              onChange={(ev) => onChange({ emotions: [], moodValence: Number(ev.target.value) })}
              className="h-11 flex-1 accent-[var(--accent)]"
            />
            <span>{t.pleasant}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotSure(false);
              setAdding(true);
              onChange({ emotions: [], moodValence: null });
            }}
            className="mt-3 min-h-10 text-sm text-muted underline underline-offset-4"
          >
            {t.useWords}
          </button>
        </section>
      ) : (
        adding &&
        !full && (
          <section aria-label={t.pickCore} className="space-y-4">
            {step.ring === "core" && recents.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm text-muted">{t.recent}</h3>
                <div className="flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <button
                      key={pathKey(r)}
                      type="button"
                      onClick={() => add({ core: r.core, middle: r.middle, precise: r.precise })}
                      className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm"
                    >
                      <span aria-hidden className="size-2.5 rounded-full" style={{ background: getCore(r.core).color }} />
                      {emotionLabel(r, lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step.ring !== "core" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={back}
                  className="flex min-h-11 items-center gap-1 rounded-full px-3 text-sm hover:bg-surface-2"
                >
                  <span aria-hidden className="inline-block rtl:rotate-180">←</span>
                  {t.back}
                </button>
                <p aria-live="polite" className="text-sm text-muted">
                  {crumbs.join(" › ")}
                </p>
              </div>
            )}

            {step.ring === "core" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {EMOTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickCore(c.id)}
                    className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-start text-base font-medium hover:bg-surface-2"
                  >
                    <span aria-hidden className="size-5 shrink-0 rounded-full" style={{ background: c.color }} />
                    {c.label[lang]}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setNotSure(true);
                    onChange({ emotions: [], moodValence: 3 });
                  }}
                  className="flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-border px-4 text-base text-muted hover:bg-surface-2"
                  disabled={value.emotions.length > 0}
                  hidden={value.emotions.length > 0}
                >
                  {t.notSure}
                </button>
              </div>
            )}

            {step.ring === "middle" && (
              <RingGrid
                color={getCore(step.core).color}
                justLabel={fmt(t.justCore, { name: getCore(step.core).label[lang] })}
                onJust={() => add({ core: step.core })}
                items={getCore(step.core).middle.map((m) => ({ id: m.id, label: m.label[lang] }))}
                onPick={(id) => pickMiddle(step.core, id)}
              />
            )}

            {step.ring === "precise" && (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t.preciseOptional}</p>
                <RingGrid
                  color={getCore(step.core).color}
                  justLabel={fmt(t.justCore, {
                    name: getMiddle(step.core, step.middle)?.label[lang] ?? "",
                  })}
                  onJust={() => add({ core: step.core, middle: step.middle })}
                  items={(getMiddle(step.core, step.middle)?.precise ?? []).map((p) => ({
                    id: p.id,
                    label: p.label[lang],
                  }))}
                  onPick={(id) => add({ core: step.core, middle: step.middle, precise: id })}
                />
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
}

function RingGrid({
  items,
  onPick,
  justLabel,
  onJust,
  color,
}: {
  items: { id: string; label: string }[];
  onPick: (id: string) => void;
  justLabel: string;
  onJust: () => void;
  color: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={onJust}
        className="col-span-2 flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-base font-medium sm:col-span-3"
        style={{ borderColor: color }}
      >
        {justLabel}
      </button>
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onPick(i.id)}
          className="flex min-h-14 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-start text-base hover:bg-surface-2"
        >
          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
          {i.label}
        </button>
      ))}
    </div>
  );
}
