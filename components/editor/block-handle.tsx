import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { GripVertical, Plus } from "lucide-react";
import type { RefObject } from "react";
import type { MenuPosition } from "./use-block-menu";

export type BlockHandleProps = {
  editor: Editor;
  /** Position du bloc survolé, tenue à jour par la poignée. */
  nodePos: RefObject<number>;
  onOpenMenu: (position: MenuPosition) => void;
};

/** Poignée affichée à gauche du bloc survolé : ajout et menu contextuel. */
export function BlockHandle({ editor, nodePos, onOpenMenu }: BlockHandleProps) {
  return (
    <DragHandle
      editor={editor}
      nested
      onNodeChange={({ pos }) => {
        nodePos.current = pos;
      }}
    >
      <div className="block-handle">
        <button
          aria-label="Ajouter un bloc"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContentAt(nodePos.current, {
                type: "paragraph",
                content: [{ type: "text", text: "/" }],
              })
              .setTextSelection(nodePos.current + 2)
              .run()
          }
          type="button"
        >
          <Plus size={16} />
        </button>
        <button
          aria-label="Déplacer ou modifier le bloc"
          onClick={(event) => {
            event.stopPropagation();
            editor.view.dispatch(
              editor.state.tr.setSelection(
                NodeSelection.create(editor.state.doc, nodePos.current)
              )
            );
            onOpenMenu({
              x: event.clientX,
              y: Math.min(event.clientY, window.innerHeight - 300),
            });
          }}
          type="button"
        >
          <GripVertical size={16} />
        </button>
      </div>
    </DragHandle>
  );
}
