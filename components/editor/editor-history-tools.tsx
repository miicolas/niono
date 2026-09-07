import { type Editor, useEditorState } from "@tiptap/react";
import { Redo2, Undo2 } from "lucide-react";

/** Boutons annuler et rétablir, actifs selon l'historique de l'éditeur. */
export function EditorHistoryTools({ editor }: { editor: Editor }) {
  const history = useEditorState({
    editor,
    selector: (ctx) => ({
      undo: ctx.editor.can().undo(),
      redo: ctx.editor.can().redo(),
    }),
  });
  return (
    <div className="editor-history-tools">
      <button
        aria-label="Annuler"
        disabled={!history.undo}
        onClick={() => editor.chain().focus().undo().run()}
        type="button"
      >
        <Undo2 size={14} />
      </button>
      <button
        aria-label="Rétablir"
        disabled={!history.redo}
        onClick={() => editor.chain().focus().redo().run()}
        type="button"
      >
        <Redo2 size={14} />
      </button>
    </div>
  );
}
