import { useEditorUI } from "./use-editor-ui";
import { Undo2, Redo2 } from "lucide-react";
import { type EditorController } from "./shared";

export function EditorHistory({
  editable,
  editorState,
  editor,
}: Pick<EditorController, "editable" | "editorState" | "editor">) {
  const { Button, Toggle, Separator, Spinner, Popover, TextForm } =
    useEditorUI();
  return (
    editable && (
      <div className="editor-history-tools">
        <Button
          aria-label="Annuler"
          disabled={!editorState?.undo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={14} />
        </Button>
        <Button
          aria-label="Rétablir"
          disabled={!editorState?.redo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={14} />
        </Button>
      </div>
    )
  );
}
