import { mergeAttributes, Node } from "@tiptap/core";

/** Bloc encadré qui met en avant une information, précédé d'un emoji. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { emoji: { default: "💡" } };
  },
  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        class: "editor-callout",
      }),
      [
        "span",
        { contenteditable: "false", class: "callout-icon" },
        HTMLAttributes.emoji,
      ],
      ["div", {}, 0],
    ];
  },
});
