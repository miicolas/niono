import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { MentionItem, MentionRange, MentionSearch } from "./mention-types";
import { dateMentions } from "./date-mentions";

export function useMentionSuggestions(
  editor: Editor | null,
  search?: MentionSearch,
) {
  const [range, setRange] = useState<MentionRange | null>(null);
  const [items, setItems] = useState<MentionItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState("");
  const dismissed = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { $from, empty } = editor.state.selection;
      const match =
        empty &&
        editor.isEditable &&
        $from.parent.isTextblock &&
        !editor.isActive("codeBlock") &&
        $from.parent
          .textBetween(0, $from.parentOffset, "\n", "\ufffc")
          .match(/(?:^|\s)(@|\[\[)([^\n@\[\]]{0,100})$/);
      if (!match) {
        dismissed.current = null;
        setRange(null);
        return;
      }
      const from = $from.pos - match[1]!.length - match[2]!.length;
      const identity = `${from}:${$from.pos}:${match[0]}`;
      if (dismissed.current === identity) return;
      const coords = editor.view.coordsAtPos($from.pos);
      setRange((previous) =>
        previous?.from === from &&
        previous.to === $from.pos &&
        previous.query === match[2]
          ? previous
          : {
              from,
              to: $from.pos,
              query: match[2]!,
              pagesOnly: match[1] === "[[",
              x: Math.max(8, Math.min(coords.left, window.innerWidth - 310)),
              y: Math.max(
                8,
                Math.min(coords.bottom + 8, window.innerHeight - 360),
              ),
            },
      );
    };
    editor.on("transaction", update);
    return () => {
      editor.off("transaction", update);
    };
  }, [editor]);
  useEffect(() => {
    let active = true;
    setSelected(0);
    setItems([]);
    if (!range) return;
    setStatus("Recherche…");
    const timer = setTimeout(async () => {
      try {
        const found = (await search?.(range.query, range.pagesOnly)) ?? [];
        if (active) {
          setItems(
            [
              ...found,
              ...(range.pagesOnly ? [] : dateMentions(range.query)),
            ].slice(0, 30),
          );
          setStatus("");
        }
      } catch {
        if (active) {
          setItems(range.pagesOnly ? [] : dateMentions(range.query));
          setStatus(
            "Recherche indisponible. Modifiez la recherche pour réessayer.",
          );
        }
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [range?.query, range?.pagesOnly, !!range, search]);
  const choose = (item: MentionItem) => {
    if (!editor?.isEditable || !range) return;
    const label =
      item.kind === "date"
        ? new Date(`${item.referenceId}T12:00:00`).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : item.label;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: range.from, to: range.to }, [
        { type: "mention", attrs: { ...item, label } },
        { type: "text", text: " " },
      ])
      .run();
    setRange(null);
  };
  return {
    range,
    items,
    selected,
    setSelected,
    status,
    choose,
    handleKeyDown: (event: KeyboardEvent) => {
      if (!range || event.isComposing) return false;
      if (event.key === "Escape") {
        const before = editor?.state.selection.$from;
        const match = before?.parent
          .textBetween(0, before.parentOffset, "\n", "\ufffc")
          .match(/(?:^|\s)(@|\[\[)([^\n@\[\]]{0,100})$/);
        dismissed.current = `${range.from}:${range.to}:${match?.[0]}`;
        setRange(null);
        return true;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setSelected(
          (index) =>
            (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            Math.max(items.length, 1),
        );
        return true;
      }
      if ((event.key === "Enter" || event.key === "Tab") && items[selected]) {
        event.preventDefault();
        choose(items[selected]);
        return true;
      }
      return false;
    },
  };
}
