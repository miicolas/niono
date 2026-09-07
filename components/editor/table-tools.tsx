import { type Editor, useEditorState } from "@tiptap/react";
import { TABLE_ACTIONS } from "./table-actions";

/** Barre d'actions affichée quand le curseur est dans un tableau. */
export function TableTools({ editor }: { editor: Editor }) {
  const inTable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor.isActive("table"),
  });
  if (!inTable) {
    return null;
  }
  return (
    <div className="table-tools">
      {TABLE_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => action.run(editor)}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
