// Pure helpers shared by server and client.

export function countWords(text: string): number {
  return text.split(/\s+/u).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** A valid entry has a feeling (or a "not sure" valence) and at least one non-empty sentence. */
export function isValidEntry(e: {
  bodyText: string;
  emotionCount: number;
  moodValence: number | null | undefined;
}): boolean {
  const hasFeeling = e.emotionCount > 0 || (e.moodValence != null && e.moodValence >= 1);
  return hasFeeling && /[\p{L}\p{N}]/u.test(e.bodyText);
}

export function firstLine(text: string, max = 140): string {
  const line = text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

/** Minimal TipTap document from plain text, one paragraph per line. */
export function textToDoc(text: string) {
  const lines = text.split("\n");
  return {
    type: "doc",
    content: lines.map((l) =>
      l.trim() ? { type: "paragraph", content: [{ type: "text", text: l }] } : { type: "paragraph" },
    ),
  };
}
