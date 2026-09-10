import {
  Bold,
  Copy,
  Italic,
  Sparkles,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ASSISTANT_HOTKEY,
  type EditorController,
  type EditorMenuAction,
} from "./shared";
import { useEditorUI } from "./use-editor-ui";
import { formatForDisplay } from "@tanstack/hotkeys";
export function EditorBlockMenu({
  blockMenu,
  blockAction,
  setBlockMenu,
  editor,
}: Pick<
  EditorController,
  "blockMenu" | "blockAction" | "setBlockMenu" | "editor"
>) {
  const { BlockMenu } = useEditorUI();
  return (
    blockMenu && (
      <BlockMenu
        x={blockMenu.x}
        y={blockMenu.y}
        onClose={() => setBlockMenu(null)}
        onRestoreFocus={() => {
          if (!editor.isDestroyed) editor.commands.focus();
        }}
        items={[
          ...(blockMenu.hasSelection
            ? [
                {
                  id: "assistant",
                  section: "Écriture",
                  label: "Améliorer avec l’assistant",
                  shortcut: formatForDisplay(ASSISTANT_HOTKEY),
                  icon: <Sparkles size={15} />,
                },
                {
                  id: "bold",
                  section: "Écriture",
                  label: "Gras",
                  shortcut: formatForDisplay("Mod+B"),
                  icon: <Bold size={15} />,
                },
                {
                  id: "italic",
                  section: "Écriture",
                  label: "Italique",
                  shortcut: formatForDisplay("Mod+I"),
                  icon: <Italic size={15} />,
                },
              ]
            : []),
          {
            id: "duplicate",
            section: "Bloc",
            label: "Dupliquer",
            icon: <Copy size={15} />,
          },
          {
            id: "up",
            section: "Bloc",
            label: "Déplacer vers le haut",
            icon: <ArrowUp size={15} />,
          },
          {
            id: "down",
            section: "Bloc",
            label: "Déplacer vers le bas",
            icon: <ArrowDown size={15} />,
          },
          {
            id: "delete",
            section: "Bloc",
            label: "Supprimer",
            shortcut: "⌫",
            icon: <Trash2 size={15} />,
          },
        ].map((action) => ({
          ...action,
          onSelect: () => blockAction(action.id as EditorMenuAction),
        }))}
      />
    )
  );
}
