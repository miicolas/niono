import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Highlighter, Link2, Sparkles } from "lucide-react";
import { useState } from "react";
import { ALIGN_OPTIONS } from "./align-options";
import { BubbleButton } from "./bubble-button";
import { ColorPalette } from "./color-palette";
import { LinkEditor } from "./link-editor";
import { MARK_BUTTONS } from "./mark-buttons";

export type EditorBubbleMenuProps = {
  editor: Editor;
  onAskAI: () => void;
  onError?: (message: string) => void;
};

/** Bulle de mise en forme affichée au-dessus du texte sélectionné. */
export function EditorBubbleMenu({
  editor,
  onAskAI,
  onError,
}: EditorBubbleMenuProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorsOpen, setColorsOpen] = useState(false);
  const active = useEditorState({
    editor,
    selector: (ctx) =>
      MARK_BUTTONS.map(({ mark }) => ctx.editor.isActive(mark)),
  });
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: current, state }) =>
        !(
          state.selection.empty ||
          current.isActive("image") ||
          current.isActive("codeBlock")
        )
      }
    >
      <div className="editor-bubble">
        <button
          className="ai-button"
          onClick={onAskAI}
          title="Demander à l’IA · ⌘ J"
          type="button"
        >
          <Sparkles size={14} />
          <span>Demander à l’IA</span>
        </button>
        <i />
        {MARK_BUTTONS.map((button, index) => (
          <BubbleButton
            active={active[index]}
            key={button.mark}
            label={button.label}
            onClick={() => button.toggle(editor)}
            title={button.label}
          >
            <button.icon size={15} />
          </BubbleButton>
        ))}
        <BubbleButton
          label="Ajouter un lien"
          onClick={() => setLinkOpen(true)}
          title="Lien"
        >
          <Link2 size={15} />
        </BubbleButton>
        <BubbleButton
          label="Couleurs et surlignage"
          onClick={() => setColorsOpen(!colorsOpen)}
        >
          <Highlighter size={15} />
        </BubbleButton>
        <i />
        {ALIGN_OPTIONS.map((option) => (
          <BubbleButton
            key={option.value}
            label={option.label}
            onClick={() =>
              editor.chain().focus().setTextAlign(option.value).run()
            }
          >
            <option.icon size={15} />
          </BubbleButton>
        ))}
        {linkOpen && (
          <LinkEditor
            editor={editor}
            onClose={() => setLinkOpen(false)}
            onError={onError}
          />
        )}
        {colorsOpen && (
          <ColorPalette editor={editor} onDone={() => setColorsOpen(false)} />
        )}
      </div>
    </BubbleMenu>
  );
}
