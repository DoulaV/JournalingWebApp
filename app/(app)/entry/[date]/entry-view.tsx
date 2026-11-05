"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Entry } from "@/lib/data/types";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/emotions";
import { RenderDoc } from "@/components/editor/render-doc";
import { EntryEditor } from "@/components/editor/entry-editor";
import { AttachmentList } from "@/components/attachments/attachment-bar";
import { FeelingChips } from "../../today/today-client";
import { Button } from "@/components/ui/button";
import { deleteEntryAction } from "../../actions";

export function EntryView({ entry, lang, t, fontSize }: { entry: Entry; lang: Lang; t: Dict; fontSize: number }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  return (
    <article className="space-y-5">
      <FeelingChips emotions={entry.emotions} valence={entry.moodValence} lang={lang} t={t} align="start" />
      {editing ? (
        <EntryEditor
          date={entry.date}
          initial={{ title: entry.title, body: entry.body, bodyText: entry.bodyText, updatedAt: entry.updatedAt }}
          t={t}
          fontSize={fontSize}
          onSaved={() => router.refresh()}
        />
      ) : (
        <div style={{ ["--entry-size" as string]: `${fontSize}px` }}>
          {entry.title && (
            <h2 className="mb-3 font-serif text-2xl font-semibold" dir="auto">
              {entry.title}
            </h2>
          )}
          <div className="entry-prose">
            <RenderDoc doc={entry.body} fallbackText={entry.bodyText} />
          </div>
        </div>
      )}
      {entry.attachments.length > 0 && <AttachmentList items={entry.attachments} t={t} />}
      <div className="no-print flex gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={() => setEditing((e) => !e)}>
          {editing ? t.common.done : t.common.edit}
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            if (!window.confirm(t.entries.deleteConfirm)) return;
            await deleteEntryAction(entry.date);
            router.push("/entries");
          }}
        >
          {t.common.delete}
        </Button>
      </div>
    </article>
  );
}
