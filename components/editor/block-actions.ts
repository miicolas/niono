import type { Node as BlockNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";

export type BlockActionKind = "duplicate" | "delete" | "up" | "down";

function duplicateBlock(editor: Editor, pos: number, node: BlockNode) {
  const json = node.toJSON();
  if (json.attrs) {
    json.attrs.id = crypto.randomUUID();
  }
  editor
    .chain()
    .focus()
    .insertContentAt(pos + node.nodeSize, json)
    .run();
}

function moveBlock(
  editor: Editor,
  pos: number,
  node: BlockNode,
  direction: "up" | "down"
) {
  const resolved = editor.state.doc.resolve(pos);
  const index = resolved.index();
  const parent = resolved.parent;
  const tr = editor.state.tr.delete(pos, pos + node.nodeSize);
  if (direction === "up" && index > 0) {
    const previous = parent.child(index - 1);
    editor.view.dispatch(tr.insert(pos - previous.nodeSize, node));
  }
  if (direction === "down" && index < parent.childCount - 1) {
    const next = parent.child(index + 1);
    editor.view.dispatch(tr.insert(pos + next.nodeSize, node));
  }
}

/**
 * Applique une action du menu de bloc au nœud situé à `pos`. Renvoie `false`
 * si aucun bloc ne s'y trouve plus.
 */
export function runBlockAction(
  editor: Editor,
  pos: number,
  kind: BlockActionKind
) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) {
    return false;
  }
  if (kind === "delete") {
    editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
  } else if (kind === "duplicate") {
    duplicateBlock(editor, pos, node);
  } else {
    moveBlock(editor, pos, node, kind);
  }
  editor.commands.focus();
  return true;
}
