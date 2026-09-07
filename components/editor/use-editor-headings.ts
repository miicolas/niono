import type { Editor } from "@tiptap/react";
import { useCallback, useEffect } from "react";
import { useLatest } from "./use-latest";

export type EditorHeading = { id: string; text: string; level: number };

function extractHeadings(editor: Editor) {
  const headings: EditorHeading[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === "heading") {
      headings.push({
        id: node.attrs.id,
        text: node.textContent,
        level: node.attrs.level,
      });
    }
  });
  return headings;
}

/**
 * Transmet les titres du document au sommaire : dès que l'éditeur est prêt,
 * puis à chaque appel de la fonction renvoyée (après chaque modification).
 */
export function useEditorHeadings(
  editor: Editor | null,
  onHeadings?: (headings: EditorHeading[]) => void
) {
  const callback = useLatest(onHeadings);
  const publish = useCallback(
    (target: Editor) => callback.current?.(extractHeadings(target)),
    [callback]
  );
  useEffect(() => {
    if (editor) {
      publish(editor);
    }
  }, [editor, publish]);
  return publish;
}
