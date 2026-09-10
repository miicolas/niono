import { FileText, User, Calendar } from "lucide-react";
import type { useMentionSuggestions } from "./use-mention-suggestions";
import { useEditorUI } from "../document-editor/use-editor-ui";

export function EditorMentionMenu({
  mentions,
}: {
  mentions: ReturnType<typeof useMentionSuggestions>;
}) {
  const { SlashMenu } = useEditorUI();
  if (!mentions.range) return null;
  return (
    <SlashMenu
      {...mentions.range}
      label="Suggestions de mentions"
      heading={mentions.range.pagesOnly ? "PAGES" : "PAGES, PERSONNES ET DATES"}
      empty={mentions.status || "Aucun résultat"}
      selected={String(mentions.selected)}
      onSelectedChange={(value) => mentions.setSelected(Number(value))}
      items={mentions.items.map((item, index) => {
        const Icon =
          item.kind === "page"
            ? FileText
            : item.kind === "person"
              ? User
              : Calendar;
        return {
          id: String(index),
          label: item.label,
          description:
            item.kind === "page"
              ? "Page"
              : item.kind === "person"
                ? "Personne"
                : "Date",
          icon: <Icon size={18} />,
          onSelect: () => mentions.choose(item),
        };
      })}
    />
  );
}
