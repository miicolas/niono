import { safeUrl } from "@digipm/contracts";
import { Node, mergeAttributes } from "@tiptap/core";
import { mediaAttributes } from "./media/media-attributes";
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
export const FileNode = Node.create({
  name: "file",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      ...mediaAttributes(),
      href: { default: "" },
      name: { default: "Fichier" },
      id: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-file]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-file": "",
        href: safeUrl(HTMLAttributes.href) ? HTMLAttributes.href : "",
        class: "editor-file",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      "↗ " + HTMLAttributes.name,
    ];
  },
});
export const PageLink = Node.create({
  name: "pageLink",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      pageId: { default: "" },
      title: { default: "Sous-page" },
      workspaceId: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-page-link]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      {
        "data-page-link": "",
        href: `/?w=${encodeURIComponent(HTMLAttributes.workspaceId)}&p=${encodeURIComponent(HTMLAttributes.pageId)}`,
        class: "editor-page-link",
      },
      "↗ " + HTMLAttributes.title,
    ];
  },
});
