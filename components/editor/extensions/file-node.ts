import { mergeAttributes, Node } from "@tiptap/core";

/** Pièce jointe non image, rendue comme un lien de téléchargement. */
export const FileNode = Node.create({
  name: "file",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
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
        class: "editor-file",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      `↗ ${HTMLAttributes.name}`,
    ];
  },
});
