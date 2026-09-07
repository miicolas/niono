import type { Editor } from "@tiptap/react";
import { useState } from "react";
import type { SlashAction } from "./slash-actions";
import { useLatest } from "./use-latest";

export type SlashState = {
  query: string;
  from: number;
  to: number;
  x: number;
  y: number;
};

export type SlashCommand = ReturnType<typeof useSlashCommand>;

const SLASH_PATTERN = /^\/([^\n/]*)$/;
const DIACRITICS = /[\u0300-\u036f]/g;

const fold = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(DIACRITICS, "");

/**
 * Menu « / » : ouvert dès qu'un bloc de texte commence par une barre oblique,
 * filtré par ce qui la suit, piloté au clavier depuis l'éditeur.
 */
export function useSlashCommand(actions: SlashAction[]) {
  const [state, setState] = useState<SlashState | null>(null);
  const [selected, setSelected] = useState(0);
  const query = fold(state?.query ?? "");
  const items = actions.filter((action) =>
    fold(`${action.label} ${action.id}`).includes(query)
  );
  const latest = useLatest({ state, selected, items });
  const close = () => setState(null);

  /** Ouvre, met à jour ou ferme le menu selon le texte qui précède le curseur. */
  const update = (editor: Editor) => {
    const { $from } = editor.state.selection;
    const before = $from.parent.isTextblock
      ? $from.parent.textBetween(0, $from.parentOffset)
      : "";
    const found = before.match(SLASH_PATTERN)?.[1];
    if (found === undefined) {
      setState(null);
      return;
    }
    const pos = editor.view.coordsAtPos($from.pos);
    if (latest.current.state?.query !== found) {
      setSelected(0);
    }
    setState({
      query: found,
      from: $from.start(),
      to: $from.pos,
      x: Math.min(pos.left, window.innerWidth - 295),
      y: Math.min(pos.bottom + 8, window.innerHeight - 380),
    });
  };

  /** Remplace le texte de la commande par le bloc choisi. */
  const run = (editor: Editor, action: SlashAction) => {
    const current = latest.current.state;
    if (current) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: current.from, to: current.to })
        .run();
    }
    setState(null);
    action.run(editor);
  };

  /** Flèches et Entrée quand le menu est ouvert ; `true` si consommé. */
  const handleKeyDown = (editor: Editor, event: KeyboardEvent) => {
    const { state: open, selected: index, items: list } = latest.current;
    if (!open) {
      return false;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSelected((i) => (i + step + list.length) % Math.max(list.length, 1));
      return true;
    }
    const chosen = list[index];
    if (event.key === "Enter" && chosen) {
      event.preventDefault();
      run(editor, chosen);
      return true;
    }
    return false;
  };

  return {
    state,
    selected,
    items,
    setSelected,
    update,
    run,
    close,
    handleKeyDown,
  };
}
