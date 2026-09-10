import { useEditorUI } from "./use-editor-ui";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { NodeSelection } from "@tiptap/pm/state";
import { GripVertical, Plus } from "lucide-react";
import { type EditorController } from "./shared";

export function EditorBlockHandle({
  editable,
  editor,
  nodePos,
  setBlockMenu,
}: Pick<EditorController, "editable" | "editor" | "nodePos" | "setBlockMenu">) {
  const { Button, Toggle, Separator, Spinner, Popover, TextForm } =
    useEditorUI();
  return (
    editable && (
      <DragHandle
        editor={editor}
        nested
        onNodeChange={({ pos }) => {
          nodePos.current = pos;
        }}
      >
        <div className="block-handle">
          <Button
            aria-label="Ajouter un bloc"
            onClick={() => {
              editor
                .chain()
                .focus()
                .insertContentAt(nodePos.current, {
                  type: "paragraph",
                  content: [{ type: "text", text: "/" }],
                })
                .setTextSelection(nodePos.current + 2)
                .run();
            }}
          >
            <Plus size={16} />
          </Button>
          <Button
            aria-label="Déplacer ou modifier le bloc"
            onClick={(e) => {
              e.stopPropagation();
              editor.view.dispatch(
                editor.state.tr.setSelection(
                  NodeSelection.create(editor.state.doc, nodePos.current),
                ),
              );
              setBlockMenu({
                x: e.clientX,
                y: Math.min(e.clientY, window.innerHeight - 300),
                hasSelection: false,
              });
            }}
          >
            <GripVertical size={16} />
          </Button>
        </div>
      </DragHandle>
    )
  );
}
