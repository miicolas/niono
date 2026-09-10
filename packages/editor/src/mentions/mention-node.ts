import { Node } from "@tiptap/core";

export const MentionNode = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return Object.fromEntries(
      ["kind", "referenceId", "label", "workspaceId"].map((key) => [
        key,
        {
          default: "",
          parseHTML: (element: HTMLElement) =>
            element.getAttribute(`data-${key.toLowerCase()}`) ?? "",
        },
      ]),
    );
  },
  parseHTML() {
    return [{ tag: "span[data-mention]" }, { tag: "a[data-mention]" }];
  },
  renderHTML({ HTMLAttributes: a }) {
    const attrs = {
      "data-mention": "",
      "data-kind": a.kind,
      "data-referenceid": a.referenceId,
      "data-label": a.label,
      "data-workspaceid": a.workspaceId,
      class: "editor-mention",
    };
    return a.kind === "page"
      ? [
          "a",
          {
            ...attrs,
            href: `/?w=${encodeURIComponent(a.workspaceId)}&p=${encodeURIComponent(a.referenceId)}`,
          },
          `↗ ${a.label}`,
        ]
      : ["span", attrs, `${a.kind === "person" ? "@" : "◷ "}${a.label}`];
  },
  renderText({ node }) {
    return node.attrs.label;
  },
});
