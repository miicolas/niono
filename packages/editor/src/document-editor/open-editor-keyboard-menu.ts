import type { EditorView } from "@tiptap/pm/view";
import type { RefObject } from "react";
import type { BlockMenuState } from "./shared";

export function openEditorKeyboardMenu({
  view,
  nodePos,
  open,
}: {
  view: EditorView;
  nodePos: RefObject<number>;
  open: (menu: BlockMenuState) => void;
}) {
  const selection = view.state.selection;
  const resolved = view.state.doc.resolve(selection.from);
  nodePos.current = resolved.depth > 0 ? resolved.before(1) : 0;
  const caret = view.coordsAtPos(selection.from);
  open({
    x: caret.left,
    y: caret.bottom,
    hasSelection: !selection.empty,
  });
}
