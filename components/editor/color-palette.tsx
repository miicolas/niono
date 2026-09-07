import type { Editor } from "@tiptap/react";
import { HIGHLIGHT_COLORS, TEXT_COLORS } from "./palette-colors";

export type ColorPaletteProps = {
  editor: Editor;
  onDone: () => void;
};

/** Couleurs de texte et de surlignage applicables à la sélection. */
export function ColorPalette({ editor, onDone }: ColorPaletteProps) {
  return (
    <div className="bubble-popover color-palette">
      {TEXT_COLORS.map((color) => (
        <button
          aria-label={`Couleur ${color}`}
          key={color}
          onClick={() => {
            editor.chain().focus().setColor(color).run();
            onDone();
          }}
          style={{ color }}
          type="button"
        >
          A
        </button>
      ))}
      {HIGHLIGHT_COLORS.map((color) => (
        <button
          aria-label={`Surlignage ${color}`}
          key={color}
          onClick={() => {
            editor.chain().focus().toggleHighlight({ color }).run();
            onDone();
          }}
          style={{ background: color }}
          type="button"
        >
          A
        </button>
      ))}
    </div>
  );
}
