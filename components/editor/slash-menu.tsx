import type { Editor } from "@tiptap/react";
import type { SlashCommand } from "./use-slash-command";

export type SlashMenuProps = {
  editor: Editor;
  slash: SlashCommand;
};

/** Liste des blocs proposés sous le curseur après une barre oblique. */
export function SlashMenu({ editor, slash }: SlashMenuProps) {
  if (!slash.state) {
    return null;
  }
  return (
    <div
      aria-label="Insérer un bloc"
      className="slash-menu"
      role="menu"
      style={{ left: slash.state.x, top: slash.state.y }}
    >
      <div className="menu-caption">BLOCS DE BASE</div>
      {slash.items.length ? (
        slash.items.map((action, index) => (
          <button
            className={index === slash.selected ? "selected" : ""}
            key={action.id}
            onClick={() => slash.run(editor, action)}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => slash.setSelected(index)}
            role="menuitem"
            type="button"
          >
            <span className="slash-icon">
              <action.icon size={20} />
            </span>
            <span>
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </span>
          </button>
        ))
      ) : (
        <p>Aucun bloc correspondant</p>
      )}
      <footer>
        <span>↑ ↓ pour naviguer</span>
        <span>↵ pour insérer</span>
      </footer>
    </div>
  );
}
