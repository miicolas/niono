import { useEditorUI } from "./use-editor-ui";
import { type EditorController } from "./shared";

export function EditorTableTools({
  editorState,
  editable,
  editor,
}: Pick<EditorController, "editorState" | "editable" | "editor">) {
  const { Button, Toggle, Separator, Spinner, Popover, TextForm } =
    useEditorUI();
  return (
    editorState?.table &&
    editable && (
      <div className="table-tools">
        {[
          {
            label: "+ Ligne",
            run: () => editor.chain().focus().addRowAfter().run(),
          },
          {
            label: "+ Colonne",
            run: () => editor.chain().focus().addColumnAfter().run(),
          },
          {
            label: "Supprimer la ligne",
            run: () => editor.chain().focus().deleteRow().run(),
          },
          {
            label: "Supprimer la colonne",
            run: () => editor.chain().focus().deleteColumn().run(),
          },
          {
            label: "Fusionner",
            run: () => editor.chain().focus().mergeCells().run(),
          },
          {
            label: "Séparer",
            run: () => editor.chain().focus().splitCell().run(),
          },
        ].map((a) => (
          <Button key={a.label} onClick={a.run}>
            {a.label}
          </Button>
        ))}
      </div>
    )
  );
}
