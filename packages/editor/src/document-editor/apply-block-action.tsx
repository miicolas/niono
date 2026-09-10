import { type Editor } from "@tiptap/react";

export function applyBlockAction(
  editor: Editor,
  pos: number,
  kind: "duplicate" | "delete" | "up" | "down",
) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  const tr = editor.state.tr;
  if (kind === "delete")
    editor.view.dispatch(tr.delete(pos, pos + node.nodeSize));
  if (kind === "duplicate") {
    const json = node.toJSON();
    if (json.attrs) json.attrs.id = crypto.randomUUID();
    editor
      .chain()
      .focus()
      .insertContentAt(pos + node.nodeSize, json)
      .run();
  }
  if (kind === "up" || kind === "down") {
    const resolved = editor.state.doc.resolve(pos);
    const index = resolved.index();
    const parent = resolved.parent;
    if (kind === "up" && index > 0) {
      const previous = parent.child(index - 1);
      editor.view.dispatch(
        tr
          .delete(pos, pos + node.nodeSize)
          .insert(pos - previous.nodeSize, node),
      );
    }
    if (kind === "down" && index < parent.childCount - 1) {
      const next = parent.child(index + 1);
      editor.view.dispatch(
        tr.delete(pos, pos + node.nodeSize).insert(pos + next.nodeSize, node),
      );
    }
  }

  editor.commands.focus();
}
