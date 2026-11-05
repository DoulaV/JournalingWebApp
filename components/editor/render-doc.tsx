// Read-only renderer for TipTap JSON. Used for past entries, print and export,
// so viewing an entry never loads the editor bundle.

import type { ReactNode } from "react";

interface Mark { type: string; attrs?: Record<string, unknown> }
export interface DocNode {
  type: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: DocNode[];
}

function renderText(n: DocNode, key: number): ReactNode {
  let el: ReactNode = n.text ?? "";
  for (const m of n.marks ?? []) {
    if (m.type === "bold") el = <strong>{el}</strong>;
    else if (m.type === "italic") el = <em>{el}</em>;
    else if (m.type === "strike") el = <s>{el}</s>;
    else if (m.type === "code") el = <code>{el}</code>;
    else if (m.type === "underline") el = <u>{el}</u>;
  }
  return <span key={key}>{el}</span>;
}

function renderNode(n: DocNode, key: number): ReactNode {
  const kids = (n.content ?? []).map((c, i) => renderNode(c, i));
  switch (n.type) {
    case "doc":
      return <>{kids}</>;
    case "paragraph":
      return <p key={key} dir="auto">{kids}</p>;
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(n.attrs?.level ?? 2)));
      const H = `h${level}` as "h1" | "h2" | "h3";
      return <H key={key} dir="auto">{kids}</H>;
    }
    case "bulletList":
      return <ul key={key} dir="auto">{kids}</ul>;
    case "orderedList":
      return <ol key={key} dir="auto">{kids}</ol>;
    case "listItem":
      return <li key={key} dir="auto">{kids}</li>;
    case "blockquote":
      return <blockquote key={key} dir="auto">{kids}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "codeBlock":
      return <pre key={key}><code>{kids}</code></pre>;
    case "text":
      return renderText(n, key);
    default:
      return kids.length ? <div key={key}>{kids}</div> : null;
  }
}

export function RenderDoc({ doc, fallbackText }: { doc: unknown; fallbackText?: string }) {
  const d = doc as DocNode | null;
  if (!d || d.type !== "doc") {
    return (
      <>
        {(fallbackText ?? "").split("\n").map((l, i) => (
          <p key={i} dir="auto">{l}</p>
        ))}
      </>
    );
  }
  return <>{renderNode(d, 0)}</>;
}

/** Plain Markdown from TipTap JSON, for export. */
export function docToMarkdown(doc: unknown, fallbackText = ""): string {
  const d = doc as DocNode | null;
  if (!d || d.type !== "doc") return fallbackText;
  const inline = (nodes: DocNode[] = []): string =>
    nodes
      .map((n) => {
        if (n.type === "hardBreak") return "  \n";
        let t = n.text ?? inline(n.content);
        for (const m of n.marks ?? []) {
          if (m.type === "bold") t = `**${t}**`;
          else if (m.type === "italic") t = `*${t}*`;
          else if (m.type === "strike") t = `~~${t}~~`;
          else if (m.type === "code") t = `\`${t}\``;
        }
        return t;
      })
      .join("");
  const block = (n: DocNode, prefix = ""): string => {
    switch (n.type) {
      case "paragraph":
        return prefix + inline(n.content);
      case "heading":
        return `${"#".repeat(Number(n.attrs?.level ?? 2))} ${inline(n.content)}`;
      case "blockquote":
        return (n.content ?? []).map((c) => block(c, "> ")).join("\n>\n");
      case "bulletList":
        return (n.content ?? []).map((li) => `- ${(li.content ?? []).map((c) => block(c)).join("\n  ")}`).join("\n");
      case "orderedList":
        return (n.content ?? [])
          .map((li, i) => `${i + 1}. ${(li.content ?? []).map((c) => block(c)).join("\n   ")}`)
          .join("\n");
      case "horizontalRule":
        return "---";
      case "codeBlock":
        return "```\n" + inline(n.content) + "\n```";
      default:
        return inline(n.content);
    }
  };
  return (d.content ?? []).map((n) => block(n)).join("\n\n");
}
