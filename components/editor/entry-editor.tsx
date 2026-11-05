"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { AutoDir } from "./auto-dir";
import { RenderDoc } from "./render-doc";
import { useAutosave, type SaveStatus } from "./use-autosave";
import { getDraft } from "@/lib/drafts";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export interface EditorInitial {
  title: string;
  body: unknown;
  bodyText: string;
  updatedAt: string | null;
}

interface Props {
  date: string;
  initial: EditorInitial;
  t: Dict;
  fontSize: number;
  /** Shown above the editor, dismissible. */
  prompt?: React.ReactNode;
  /** Extra controls in the toolbar (attachments, rituals). */
  toolbar?: React.ReactNode;
  onFontSize?: (size: number) => void;
  onSaved?: () => void;
  autoFocus?: boolean;
  /** Text inserted when a ritual is started (heading). */
  insertRequest?: { id: number; heading: string } | null;
  appendText?: { id: number; text: string } | null;
}

export function EntryEditor({
  date,
  initial,
  t,
  fontSize,
  prompt,
  toolbar,
  onFontSize,
  onSaved,
  autoFocus = true,
  insertRequest,
  appendText,
}: Props) {
  const [title, setTitle] = useState(initial.title);
  const [focus, setFocus] = useState(false);
  const { status, queue, flush } = useAutosave(date, onSaved ? () => onSaved() : undefined);
  const titleRef = useRef(title);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Placeholder.configure({ placeholder: t.today.editorPlaceholder }),
      AutoDir,
    ],
    content: (initial.body as object) ?? (initial.bodyText ? textDoc(initial.bodyText) : ""),
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "entry-prose",
        "aria-label": t.today.editorPlaceholder,
        role: "textbox",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      void queue({
        title: titleRef.current,
        body: editor.getJSON(),
        bodyText: editor.getText({ blockSeparator: "\n" }),
      });
    },
    onBlur: () => void flush(),
  });

  // Restore an unsynced local draft that is newer than the server copy.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    void getDraft(date).then((d) => {
      if (cancelled || !d || d.synced || d.body === undefined) return;
      const serverTime = initial.updatedAt ? Date.parse(initial.updatedAt) : 0;
      if (d.updatedAt > serverTime) {
        editor.commands.setContent(d.body as object, { emitUpdate: false });
        if (d.title !== undefined) {
          setTitle(d.title);
          titleRef.current = d.title;
        }
        void flush();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editor, date, initial.updatedAt, flush]);

  useEffect(() => {
    if (!editor || !insertRequest) return;
    editor
      .chain()
      .focus("end")
      .insertContent([
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: insertRequest.heading }],
        },
        { type: "paragraph" },
      ])
      .run();
  }, [editor, insertRequest]);

  useEffect(() => {
    if (!editor || !appendText) return;
    editor
      .chain()
      .focus("end")
      .insertContent(
        appendText.text
          .split("\n")
          .map((l) => ({ type: "paragraph", content: l ? [{ type: "text", text: l }] : [] })),
      )
      .run();
  }, [editor, appendText]);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocus(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  return (
    <div
      className={cn(
        focus &&
          "bg-bg fixed inset-0 z-50 overflow-y-auto px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-24",
      )}
      style={{ ["--entry-size" as string]: `${fontSize}px` }}
    >
      <div className={cn("mx-auto max-w-2xl", focus && "pt-6")}>
        <div
          className={cn("no-print mb-3 flex flex-wrap items-center gap-2", focus && "justify-end")}
        >
          <span className="flex-1" />
          <SaveIndicator status={status} t={t} />
          {!focus && onFontSize && (
            <>
              <button
                type="button"
                onClick={() => onFontSize(Math.max(14, fontSize - 1))}
                className="hover:bg-surface-2 flex size-10 items-center justify-center rounded-full text-sm"
                aria-label={t.today.fontSmaller}
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => onFontSize(Math.min(28, fontSize + 1))}
                className="hover:bg-surface-2 flex size-10 items-center justify-center rounded-full text-lg"
                aria-label={t.today.fontLarger}
              >
                A+
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setFocus((f) => !f)}
            className="hover:bg-surface-2 min-h-10 rounded-full px-3 text-sm"
            aria-pressed={focus}
          >
            {focus ? t.today.exitFocus : t.today.focus}
          </button>
        </div>

        {!focus && prompt}

        <label htmlFor={`title-${date}`} className="sr-only">
          {t.today.title}
        </label>
        <input
          id={`title-${date}`}
          value={title}
          dir="auto"
          onChange={(e) => {
            setTitle(e.target.value);
            titleRef.current = e.target.value;
            if (editor) {
              void queue({
                title: e.target.value,
                body: editor.getJSON(),
                bodyText: editor.getText({ blockSeparator: "\n" }),
              });
            }
          }}
          onBlur={() => void flush()}
          placeholder={t.today.titlePlaceholder}
          className="placeholder:text-muted/70 mb-3 w-full bg-transparent font-serif text-2xl font-semibold focus:outline-none"
        />
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          // Same content, same size, before the editor loads: no layout shift.
          <div className="entry-prose min-h-[40vh]" aria-hidden>
            <RenderDoc doc={initial.body} fallbackText={initial.bodyText} />
          </div>
        )}
        {!focus && toolbar && (
          <div className="no-print border-border mt-6 flex flex-wrap items-start gap-2 border-t pt-4">
            {toolbar}
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ status, t }: { status: SaveStatus; t: Dict }) {
  const label =
    status === "saving"
      ? t.common.saving
      : status === "saved"
        ? t.common.saved
        : status === "offline"
          ? t.common.savedOffline
          : status === "error"
            ? t.common.errorShort
            : "";
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("text-sm", status === "error" ? "text-danger" : "text-muted")}
    >
      {label}
    </span>
  );
}

function textDoc(text: string) {
  return {
    type: "doc",
    content: text
      .split("\n")
      .map((l) =>
        l ? { type: "paragraph", content: [{ type: "text", text: l }] } : { type: "paragraph" },
      ),
  };
}
