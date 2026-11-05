import { Extension } from "@tiptap/react";

/** Adds dir="auto" to every block so Arabic and English paragraphs each get the right direction. */
export const AutoDir = Extension.create({
  name: "autoDir",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote", "listItem", "bulletList", "orderedList"],
        attributes: {
          dir: {
            default: "auto",
            parseHTML: (el) => el.getAttribute("dir") || "auto",
            renderHTML: (attrs) => ({ dir: (attrs.dir as string) || "auto" }),
          },
        },
      },
    ];
  },
});
