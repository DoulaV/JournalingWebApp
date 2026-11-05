"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIn } from "@/components/today/check-in";
import dynamic from "next/dynamic";
import { EmotionPicker, type PickerValue } from "@/components/emotion-picker/emotion-picker";
import { TagPicker } from "@/components/tags/tag-picker";
import { AttachmentBar } from "@/components/attachments/attachment-bar";
import { Button } from "@/components/ui/button";
import type { Entry, EmotionInput, Tag } from "@/lib/data/types";
import { breadcrumb, getCore, pathKey, type Lang } from "@/lib/emotions";
import type { Dict } from "@/lib/i18n";
import { putDraft } from "@/lib/drafts";
import { syncDraft } from "@/lib/sync";
import { textToDoc } from "@/lib/data/entry-utils";
import { RITUAL_PROMPTS } from "@/lib/prompts";
import { anotherPromptAction } from "../actions";
import { setFontSizeAction } from "../settings/actions";

// The editor bundle (TipTap) loads as its own chunk so the page is usable sooner.
const EntryEditor = dynamic(
  () => import("@/components/editor/entry-editor").then((m) => m.EntryEditor),
  {
    ssr: false,
    loading: () => <div className="min-h-[calc(40vh+13rem)]" aria-hidden />,
  },
);

interface Props {
  date: string;
  lang: Lang;
  t: Dict;
  entry: Entry | null;
  depth: 1 | 2 | 3;
  recents: EmotionInput[];
  tags: Tag[];
  bodyCheck: boolean;
  fontSize: number;
  prompt: { id: string; text: string } | null;
  showPrompts: boolean;
  suggestedRitual: "morning" | "evening" | null;
  weeklyPrompt: string | null;
  isBackfill: boolean;
}

type Mode = "checkin" | "saved" | "write" | "done";

export function TodayClient(props: Props) {
  const {
    date,
    lang,
    t,
    entry,
    depth,
    recents,
    tags,
    bodyCheck,
    suggestedRitual,
    weeklyPrompt,
    isBackfill,
  } = props;
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(entry ? "write" : "checkin");
  const [initial, setInitial] = useState({
    title: entry?.title ?? "",
    body: entry?.body ?? null,
    bodyText: entry?.bodyText ?? "",
    updatedAt: entry?.updatedAt ?? null,
  });
  const [feelings, setFeelings] = useState<PickerValue>({
    emotions: entry?.emotions ?? [],
    moodValence: entry?.moodValence ?? null,
  });
  const [tagIds, setTagIds] = useState<string[]>(entry?.tagIds ?? []);
  const [editingFeelings, setEditingFeelings] = useState(false);
  const [fontSize, setFontSize] = useState(props.fontSize);
  const [prompt, setPrompt] = useState(props.prompt);
  const [promptHidden, setPromptHidden] = useState(false);
  const [insert, setInsert] = useState<{ id: number; heading: string } | null>(null);
  const [append, setAppend] = useState<{ id: number; text: string } | null>(null);
  const [entryId, setEntryId] = useState<string | null>(entry?.id ?? null);
  const metaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch a prompt once the entry exists (prompts follow the chosen feeling).
  useEffect(() => {
    if (mode === "write" && !prompt && props.showPrompts && !isBackfill && !entry) {
      void anotherPromptAction(null).then((p) => p && setPrompt({ id: p.id, text: p[lang] }));
    }
  }, [mode, prompt, props.showPrompts, isBackfill, entry, lang]);

  const saveMeta = useCallback(
    (patch: { emotions?: EmotionInput[]; moodValence?: number | null; tagIds?: string[] }) => {
      if (metaTimer.current) clearTimeout(metaTimer.current);
      metaTimer.current = setTimeout(async () => {
        const d = await putDraft(date, patch);
        await syncDraft(d);
      }, 800);
    },
    [date],
  );

  const onSavedRefresh = useCallback(() => {
    if (!entryId) router.refresh();
  }, [entryId, router]);

  if (mode === "checkin") {
    return (
      <CheckIn
        date={date}
        depth={depth}
        recents={recents}
        tags={tags}
        lang={lang}
        t={t}
        bodyCheck={bodyCheck}
        ritual={suggestedRitual ?? "free"}
        onSaved={(r) => {
          setInitial({
            title: "",
            body: textToDoc(r.line),
            bodyText: r.line,
            updatedAt: new Date().toISOString(),
          });
          setFeelings({ emotions: r.emotions, moodValence: r.moodValence });
          setTagIds(r.tagIds);
          setMode("saved");
          router.refresh();
        }}
      />
    );
  }

  if (mode === "saved" || mode === "done") {
    return (
      <section
        className="animate-bloom border-border bg-surface rounded-2xl border p-6 text-center"
        data-testid="checkin-saved"
      >
        <div
          aria-hidden
          className="animate-halo bg-accent-soft mx-auto mb-4 size-12 rounded-full"
        />
        <h2 className="font-serif text-2xl font-semibold">{t.checkin.savedTitle}</h2>
        {mode === "saved" && <p className="text-muted mt-2">{t.checkin.savedBody}</p>}
        <FeelingChips
          emotions={feelings.emotions}
          lang={lang}
          t={t}
          valence={feelings.moodValence}
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => setMode("write")}>
            {t.today.keepWriting}
          </Button>
          {mode === "saved" && (
            <Button size="lg" variant="secondary" onClick={() => setMode("done")}>
              {t.today.doneForToday}
            </Button>
          )}
        </div>
      </section>
    );
  }

  const ritualButtons = !isBackfill && (
    <>
      {(["morning", "evening"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setInsert({ id: Date.now(), heading: RITUAL_PROMPTS[r][lang] })}
          className={`min-h-10 rounded-full border px-3 text-sm ${suggestedRitual === r ? "border-accent bg-accent-soft" : "border-border"}`}
        >
          {r === "morning" ? t.today.addMorning : t.today.addEvening}
        </button>
      ))}
    </>
  );

  const promptNode =
    prompt && !promptHidden ? (
      <aside className="bg-surface-2 mb-5 rounded-2xl p-4" aria-label="prompt" data-testid="prompt">
        <p className="font-serif text-lg" dir="auto">
          {prompt.text}
        </p>
        <div className="mt-2 flex gap-2 text-sm">
          <button
            type="button"
            className="text-muted inline-flex min-h-11 items-center rounded-full px-3 underline-offset-4 hover:underline"
            onClick={async () => {
              const p = await anotherPromptAction(prompt.id);
              if (p) setPrompt({ id: p.id, text: p[lang] });
            }}
          >
            {t.today.anotherPrompt}
          </button>
          <button
            type="button"
            className="text-muted inline-flex min-h-11 items-center rounded-full px-3 underline-offset-4 hover:underline"
            onClick={() => setPromptHidden(true)}
          >
            {t.today.dismissPrompt}
          </button>
        </div>
        {weeklyPrompt && (
          <p className="border-border mt-3 border-t pt-3 text-sm" dir="auto">
            <span className="font-medium">{t.today.weeklyReview}: </span>
            {weeklyPrompt}
          </p>
        )}
      </aside>
    ) : weeklyPrompt ? (
      <aside className="bg-surface-2 mb-5 rounded-2xl p-4 text-sm" dir="auto">
        <span className="font-medium">{t.today.weeklyReview}: </span>
        {weeklyPrompt}
      </aside>
    ) : null;

  return (
    <div className="space-y-5" data-testid="today-write">
      <section className="border-border bg-surface rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-muted text-sm font-medium">{t.today.emotionsToday}</h2>
          <button
            type="button"
            className="hover:bg-surface-2 min-h-9 rounded-full px-3 text-sm"
            aria-expanded={editingFeelings}
            onClick={() => setEditingFeelings((v) => !v)}
          >
            {editingFeelings ? t.common.done : t.today.editFeelings}
          </button>
        </div>
        {editingFeelings ? (
          <div className="mt-4 space-y-5">
            <EmotionPicker
              value={feelings}
              onChange={(v) => {
                setFeelings(v);
                saveMeta({
                  emotions: v.emotions,
                  moodValence: v.emotions.length ? null : v.moodValence,
                });
              }}
              depth={depth}
              recents={recents}
              lang={lang}
              t={t.picker}
              bodyCheck={bodyCheck}
            />
            <TagPicker
              tags={tags}
              value={tagIds}
              onChange={(ids) => {
                setTagIds(ids);
                saveMeta({ tagIds: ids });
              }}
              lang={lang}
              label={t.checkin.stepTags}
            />
          </div>
        ) : (
          <FeelingChips
            emotions={feelings.emotions}
            lang={lang}
            t={t}
            valence={feelings.moodValence}
            align="start"
          />
        )}
      </section>

      <EntryEditor
        date={date}
        initial={initial}
        t={t}
        fontSize={fontSize}
        autoFocus
        prompt={promptNode}
        insertRequest={insert}
        appendText={append}
        onSaved={onSavedRefresh}
        onFontSize={(s) => {
          setFontSize(s);
          void setFontSizeAction(s);
        }}
        toolbar={
          <>
            {ritualButtons}
            <AttachmentBar
              date={date}
              entryId={entryId}
              initial={entry?.attachments ?? []}
              t={t}
              onEntryId={setEntryId}
              onTranscript={(text) => setAppend({ id: Date.now(), text })}
            />
          </>
        }
      />
    </div>
  );
}

export function FeelingChips({
  emotions,
  valence,
  lang,
  t,
  align = "center",
}: {
  emotions: EmotionInput[];
  valence: number | null;
  lang: Lang;
  t: Dict;
  align?: "center" | "start";
}) {
  if (!emotions.length && valence == null) return null;
  return (
    <ul className={`mt-3 flex flex-wrap gap-2 ${align === "center" ? "justify-center" : ""}`}>
      {emotions.map((e) => (
        <li
          key={pathKey(e)}
          className="bg-surface-2 flex min-h-9 items-center gap-2 rounded-full px-3 text-sm"
        >
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: getCore(e.core).color }}
          />
          {breadcrumb(e, lang).join(" › ")}
          <span className="text-muted">· {e.intensity}/5</span>
        </li>
      ))}
      {!emotions.length && valence != null && (
        <li className="bg-surface-2 min-h-9 rounded-full px-3 py-2 text-sm">
          {t.picker.notSure} · {valence}/5
        </li>
      )}
    </ul>
  );
}
