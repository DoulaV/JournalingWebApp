"use client";

import { useState } from "react";
import { EmotionPicker, type PickerValue } from "@/components/emotion-picker/emotion-picker";
import { TagPicker } from "@/components/tags/tag-picker";
import { Button } from "@/components/ui/button";
import type { EmotionInput, Ritual, Tag } from "@/lib/data/types";
import type { Lang } from "@/lib/emotions";
import type { Dict } from "@/lib/i18n";
import { putDraft } from "@/lib/drafts";
import { syncDraft } from "@/lib/sync";
import { textToDoc } from "@/lib/data/entry-utils";

export interface CheckInResult {
  emotions: EmotionInput[];
  moodValence: number | null;
  line: string;
  tagIds: string[];
  synced: boolean;
}

interface Props {
  date: string;
  depth: 1 | 2 | 3;
  recents: EmotionInput[];
  tags: Tag[];
  lang: Lang;
  t: Dict;
  bodyCheck: boolean;
  ritual: Ritual;
  onSaved: (r: CheckInResult) => void;
  onJustWrite: () => void;
}

export function CheckIn({
  date,
  depth,
  recents,
  tags,
  lang,
  t,
  bodyCheck,
  ritual,
  onSaved,
  onJustWrite,
}: Props) {
  const [step, setStep] = useState<"feel" | "why">("feel");
  const [value, setValue] = useState<PickerValue>({ emotions: [], moodValence: null });
  const [line, setLine] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFeeling = value.emotions.length > 0 || value.moodValence != null;
  const hasLine = /[\p{L}\p{N}]/u.test(line);

  async function save() {
    if (!hasFeeling) return setError(t.checkin.needEmotion);
    if (!hasLine) return setError(t.checkin.needSentence);
    setBusy(true);
    setError(null);
    const text = line.trim();
    const draft = await putDraft(date, {
      title: "",
      body: textToDoc(text),
      bodyText: text,
      emotions: value.emotions,
      moodValence: value.emotions.length ? null : value.moodValence,
      tagIds,
      ritual,
    });
    const r = await syncDraft(draft);
    setBusy(false);
    if (!r.ok && r.reason !== "offline") {
      setError(t.common.errorShort);
      return;
    }
    onSaved({
      emotions: value.emotions,
      moodValence: value.moodValence,
      line: text,
      tagIds,
      synced: r.ok,
    });
  }

  return (
    <section aria-label={t.today.checkInTitle} className="space-y-5" data-testid="check-in">
      {step === "feel" ? (
        <>
          <h2 id="checkin-title" className="font-serif text-2xl font-semibold">
            {t.checkin.stepFeel}
          </h2>
          <p className="text-muted -mt-3">{t.checkin.startHint}</p>
          <EmotionPicker
            value={value}
            onChange={(v) => {
              setValue(v);
              setError(null);
            }}
            depth={depth}
            recents={recents}
            lang={lang}
            t={t.picker}
            bodyCheck={bodyCheck}
          />
          <div className="sticky bottom-20 z-10 pt-2 md:bottom-4">
            <Button
              size="lg"
              className="w-full shadow-sm"
              disabled={!hasFeeling}
              onClick={() => setStep("why")}
            >
              {t.common.next}
            </Button>
            <button
              type="button"
              onClick={onJustWrite}
              className="text-muted mt-1 min-h-11 w-full text-sm underline underline-offset-4"
            >
              {t.checkin.justWrite}
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setStep("feel")}
            className="text-muted flex min-h-10 items-center gap-1 text-sm"
          >
            <span aria-hidden className="inline-block rtl:rotate-180">
              ←
            </span>{" "}
            {t.common.back}
          </button>
          <h2 id="checkin-title" className="font-serif text-2xl font-semibold">
            <label htmlFor="checkin-line">{t.checkin.stepWhy}</label>
          </h2>
          <textarea
            id="checkin-line"
            value={line}
            onChange={(e) => {
              setLine(e.target.value);
              setError(null);
            }}
            rows={3}
            dir="auto"
            autoFocus
            placeholder={t.checkin.whyPlaceholder}
            className="entry-prose border-border bg-surface block w-full resize-none rounded-2xl border p-4"
          />
          <TagPicker
            tags={tags}
            value={tagIds}
            onChange={setTagIds}
            lang={lang}
            label={`${t.checkin.stepTags} (${t.common.optional})`}
          />
          <Button size="lg" className="w-full" onClick={save} disabled={busy || !hasLine}>
            {busy ? t.common.saving : t.checkin.save}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
