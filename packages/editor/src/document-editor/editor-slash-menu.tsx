import { type EditorController } from "./shared";
import { useEditorUI } from "./use-editor-ui";
export function EditorSlashMenu({
  slash,
  filtered,
  selected,
  setSelected,
  run,
}: Pick<
  EditorController,
  "slash" | "filtered" | "selected" | "setSelected" | "run"
>) {
  const { SlashMenu } = useEditorUI();
  return (
    slash && (
      <SlashMenu
        x={slash.x}
        y={slash.y}
        selected={filtered[selected]?.id ?? ""}
        onSelectedChange={(id) => {
          const index = filtered.findIndex((item) => item.id === id);
          if (index >= 0) setSelected(index);
        }}
        items={filtered.map((action) => ({
          id: action.id,
          label: action.label,
          description: action.description,
          icon: <action.icon size={20} />,
          onSelect: () => run(action),
        }))}
      />
    )
  );
}
