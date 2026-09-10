import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import { yUndoPluginKey } from "y-prosemirror";

/** Media actions are individually undoable in both local and shared documents. */
export function changeMedia(editor: Editor, change: () => void) {
  if (editor.isDestroyed || !editor.isEditable) return;
  const undo = yUndoPluginKey.getState(editor.state)?.undoManager;
  undo?.stopCapturing();
  editor.view.dispatch(closeHistory(editor.state.tr));
  change();
  if (!editor.isDestroyed) {
    editor.view.dispatch(closeHistory(editor.state.tr));
    undo?.stopCapturing();
  }
}
