import { TextSelection } from "@tiptap/pm/state";
import { BubbleMenu } from "@tiptap/react/menus";
import { formatForDisplay } from "@tanstack/hotkeys";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Sparkles,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { ASSISTANT_HOTKEY, type EditorController } from "./shared";
import { useEditorUI } from "./use-editor-ui";

export function EditorBubble({
  editable,
  editor,
  askAI,
  onCodex,
  codexIcon,
  aiAvailable,
  editorState,
  setLink,
  setColors,
  colors,
  link,
  blockMenu,
}: Pick<
  EditorController,
  | "editable"
  | "editor"
  | "askAI"
  | "onCodex"
  | "codexIcon"
  | "aiAvailable"
  | "editorState"
  | "setLink"
  | "setColors"
  | "colors"
  | "link"
  | "blockMenu"
  | "onError"
  | "Input"
>) {
  const { Button, Toggle, Separator, Popover, TextForm } = useEditorUI();
  return (
    editable && (
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 8 }}
        shouldShow={({ editor, state }) =>
          state.selection instanceof TextSelection &&
          !state.selection.empty &&
          !blockMenu &&
          !editor.isActive("image") &&
          !editor.isActive("codeBlock")
        }
      >
        <div className="editor-bubble">
          <Button
            className="ai-button"
            onClick={() => askAI()}
            title={`${onCodex ? "Demander à Codex" : "Demander à l’IA"} · ${formatForDisplay(ASSISTANT_HOTKEY)}`}
          >
            {onCodex && codexIcon ? codexIcon : <Sparkles size={14} />}
            <span>{onCodex ? "Demander à Codex" : "Demander à l’IA"}</span>
          </Button>
          {onCodex && aiAvailable && (
            <Button onClick={() => askAI(true)}>Autre IA</Button>
          )}
          <Separator orientation="vertical" className="h-5" />
          {[
            {
              label: "Gras",
              icon: Bold,
              pressed: editorState?.bold,
              run: () => editor.chain().focus().toggleBold().run(),
            },
            {
              label: "Italique",
              icon: Italic,
              pressed: editorState?.italic,
              run: () => editor.chain().focus().toggleItalic().run(),
            },
            {
              label: "Souligner",
              icon: Underline,
              pressed: editorState?.underline,
              run: () => editor.chain().focus().toggleUnderline().run(),
            },
            {
              label: "Barrer",
              icon: Strikethrough,
              pressed: editorState?.strike,
              run: () => editor.chain().focus().toggleStrike().run(),
            },
          ].map((action) => (
            <Toggle
              key={action.label}
              title={action.label}
              aria-label={action.label}
              pressed={!!action.pressed}
              onPressedChange={action.run}
            >
              <action.icon size={15} />
            </Toggle>
          ))}
          <Popover
            open={link !== null}
            onOpenChange={(open) =>
              setLink(open ? (editor.getAttributes("link").href ?? "") : null)
            }
            label="Adresse du lien"
            onRestoreFocus={() => {
              if (!editor.isDestroyed) editor.commands.focus();
            }}
            trigger={
              <Button aria-label="Ajouter un lien">
                <Link2 size={15} />
              </Button>
            }
          >
            <TextForm
              kind="link"
              value={link ?? ""}
              onSubmit={(value) => {
                if (value)
                  editor.chain().focus().setLink({ href: value }).run();
                else editor.chain().focus().unsetLink().run();
                setLink(null);
              }}
            />
          </Popover>
          <Popover
            open={colors}
            onOpenChange={setColors}
            label="Couleurs et surlignage"
            onRestoreFocus={() => {
              if (!editor.isDestroyed) editor.commands.focus();
            }}
            trigger={
              <Button aria-label="Couleurs et surlignage">
                <Highlighter size={15} />
              </Button>
            }
          >
            <div className="color-palette flex flex-wrap gap-1">
              {[
                "#deddd8",
                "#9da3aa",
                "#ca8d8d",
                "#d3b789",
                "#95b69c",
                "#92b2d0",
                "#bba2d1",
              ].map((color) => (
                <Button
                  key={color}
                  aria-label={`Couleur ${color}`}
                  style={{ color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setColors(false);
                  }}
                >
                  A
                </Button>
              ))}
              {["#4a3b2b", "#284136", "#263e52", "#44344e"].map((color) => (
                <Button
                  key={color}
                  aria-label={`Surlignage ${color}`}
                  style={{ background: color }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color }).run();
                    setColors(false);
                  }}
                >
                  A
                </Button>
              ))}
            </div>
          </Popover>
          <Separator orientation="vertical" className="h-5" />
          <Button
            aria-label="Aligner à gauche"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={15} />
          </Button>
          <Button
            aria-label="Centrer"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={15} />
          </Button>
          <Button
            aria-label="Aligner à droite"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={15} />
          </Button>
        </div>
      </BubbleMenu>
    )
  );
}
