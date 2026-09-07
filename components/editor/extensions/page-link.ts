import { Node } from "@tiptap/core";

/** Renvoi vers une autre page de l'espace. */
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
      `↗ ${HTMLAttributes.title}`,
    ];
  },
});
