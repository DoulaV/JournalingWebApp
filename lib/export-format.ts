// Pure helpers that turn an export into Markdown files.
import { docToMarkdown } from "@/components/editor/render-doc";
import type { JournalExport } from "@/lib/data/export";
import { breadcrumb, isCoreId } from "@/lib/emotions";
import { tagLabel } from "@/lib/tags";

export function entryToMarkdown(
  e: JournalExport["entries"][number],
  tagNames: Map<string, string>,
  attachmentFiles: string[] = [],
): string {
  const feelings = [...e.emotions]
    .sort((a, b) => a.position - b.position)
    .filter((m) => isCoreId(m.core))
    .map(
      (m) =>
        `${breadcrumb({ core: m.core as never, middle: m.middle, precise: m.precise }, "en").join(" > ")} (${m.intensity}/5)`,
    );
  const tags = e.tag_ids.map((id) => tagLabel(tagNames.get(id) ?? "", "en")).filter(Boolean);
  const front = [
    "---",
    `date: ${e.entry_date}`,
    e.title ? `title: ${JSON.stringify(e.title)}` : null,
    feelings.length ? `feelings: [${feelings.map((f) => JSON.stringify(f)).join(", ")}]` : null,
    e.mood_valence != null ? `mood_valence: ${e.mood_valence}` : null,
    tags.length ? `tags: [${tags.map((x) => JSON.stringify(x)).join(", ")}]` : null,
    `ritual: ${e.ritual}`,
    e.is_backfilled ? "backfilled: true" : null,
    "---",
  ].filter(Boolean);
  const body = docToMarkdown(e.body, e.body_text);
  const files = attachmentFiles.map((f) =>
    f.endsWith(".jpg") ? `![photo](${f})` : `[voice note](${f})`,
  );
  const transcripts = e.attachments.filter((a) => a.transcript).map((a) => `> ${a.transcript}`);
  return (
    [
      front.join("\n"),
      "",
      e.title ? `# ${e.title}\n` : "",
      body,
      files.length ? `\n${files.join("\n")}` : "",
      transcripts.length ? `\n${transcripts.join("\n")}` : "",
    ]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n"
  );
}
