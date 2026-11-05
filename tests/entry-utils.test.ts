import { describe, expect, it } from "vitest";
import { countWords, firstLine, isValidEntry, textToDoc } from "@/lib/data/entry-utils";
import { docToMarkdown } from "@/components/editor/render-doc";

describe("entry utils", () => {
  it("counts words in English and Arabic", () => {
    expect(countWords("Hello there, friend.")).toBe(3);
    expect(countWords("كان يومًا طويلًا")).toBe(3);
    expect(countWords("  ...  ")).toBe(0);
  });

  it("validates the minimum entry: one feeling and one sentence", () => {
    expect(isValidEntry({ bodyText: "Tired.", emotionCount: 1, moodValence: null })).toBe(true);
    expect(isValidEntry({ bodyText: "Tired.", emotionCount: 0, moodValence: 2 })).toBe(true);
    expect(isValidEntry({ bodyText: "   ", emotionCount: 1, moodValence: null })).toBe(false);
    expect(isValidEntry({ bodyText: "Words", emotionCount: 0, moodValence: null })).toBe(false);
    expect(isValidEntry({ bodyText: "متعب", emotionCount: 1, moodValence: null })).toBe(true);
  });

  it("previews the first non-empty line", () => {
    expect(firstLine("\n\n  First line\nSecond")).toBe("First line");
    expect(firstLine("x".repeat(200), 10)).toHaveLength(10);
  });

  it("converts text to a doc and a doc to Markdown", () => {
    const doc = textToDoc("One\nTwo");
    expect(docToMarkdown(doc)).toBe("One\n\nTwo");
    const rich = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Evening" }] },
        { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }] }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "q" }] }] },
      ],
    };
    expect(docToMarkdown(rich)).toBe("## Evening\n\n**bold**\n\n- a\n\n> q");
  });
});
