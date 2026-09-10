import type { Editor } from "@tiptap/react";
import type { RefObject } from "react";
import { applyBlockAction } from "./apply-block-action";
import type { EditorMenuAction } from "./shared";

export function createEditorMenuAction({
  editor,
  nodePos,
  close,
  askAI,
}: {
  editor: Editor | null;
  nodePos: RefObject<number>;
  close: () => void;
  askAI: () => void;
}) {
  return (kind: EditorMenuAction) => {
    if (!editor) return;
    close();
    if (kind === "assistant") return askAI();
    if (kind === "bold") return void editor.chain().focus().toggleBold().run();
    if (kind === "italic")
      return void editor.chain().focus().toggleItalic().run();
    applyBlockAction(editor, nodePos.current, kind);
  };
}
