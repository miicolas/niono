import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { RefObject } from "react";
import type { BlockMenuState } from "./shared";

export function openEditorContextMenu({
  view,
  event,
  editable,
  nodePos,
  open,
}: {
  view: EditorView;
  event: MouseEvent;
  editable: boolean;
  nodePos: RefObject<number>;
  open: (menu: BlockMenuState) => void;
}) {
  if (!editable || event.shiftKey) return false;
  const pointer =
    event.clientX || event.clientY
      ? view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
      : undefined;
  const position = pointer ?? view.state.selection.from;
  const selection = view.state.selection;
  const keepSelection =
    !selection.empty && position >= selection.from && position <= selection.to;
  if (!keepSelection) {
    const cursor = TextSelection.near(view.state.doc.resolve(position));
    view.dispatch(view.state.tr.setSelection(cursor));
  }
  const resolved = view.state.doc.resolve(position);
  nodePos.current = resolved.depth > 0 ? resolved.before(1) : 0;
  const caret = view.coordsAtPos(position);
  open({
    x: event.clientX || caret.left,
    y: event.clientY || caret.bottom,
    hasSelection: keepSelection,
  });
  event.preventDefault();
  return true;
}
