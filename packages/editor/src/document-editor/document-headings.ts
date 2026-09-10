import type { Editor } from "@tiptap/react";
export function documentHeadings(e: Editor) {
  const headings: { id: string; text: string; level: number }[] = [];
  e.state.doc.descendants((n) => {
    if (n.type.name === "heading")
      headings.push({
        id: n.attrs.id,
        text: n.textContent,
        level: n.attrs.level,
      });
  });
  return headings;
}
