import type { Editor } from "@tiptap/react";
import type { SlashMenuState } from "./shared";

export function slashMenuAtSelection(editor: Editor): SlashMenuState | null {
  const { $from } = editor.state.selection;
  if (!$from.parent.isTextblock) return null;
  const match = $from.parent
    .textBetween(0, $from.parentOffset)
    .match(/^\/([^\n/]*)$/);
  if (!match) return null;
  const pos = editor.view.coordsAtPos($from.pos);
  return {
    query: match[1]!,
    from: $from.start(),
    to: $from.pos,
    x: Math.max(8, Math.min(pos.left, window.innerWidth - 295)),
    y: Math.max(8, Math.min(pos.bottom + 8, window.innerHeight - 380)),
  };
}
