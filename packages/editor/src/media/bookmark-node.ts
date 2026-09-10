import { safeUrl } from "@digipm/contracts";
import { Node, mergeAttributes } from "@tiptap/core";
import { mediaAttributes } from "./media-attributes";

export const BookmarkNode = Node.create({
  name: "bookmark",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      ...mediaAttributes(),
      href: { default: "" },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-bookmark]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-bookmark": "",
        class: "editor-bookmark",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      HTMLAttributes.title || HTMLAttributes.href || "Signet web",
    ];
  },
});
