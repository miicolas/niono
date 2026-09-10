import type { EditorUI } from "@digipm/editor/document-editor/editor-ui";
import type { ComponentProps } from "react";
import {
  Command,
  CommandGroup,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
export function EditorSlashMenu({
  label = "Insérer un bloc",
  heading = "BLOCS DE BASE",
  empty = "Aucun bloc correspondant",
  x,
  y,
  items,
  selected,
  onSelectedChange,
}: ComponentProps<EditorUI["SlashMenu"]>) {
  return (
    <Command
      className="slash-menu"
      style={{ left: x, top: y, height: "auto" }}
      shouldFilter={false}
      value={selected}
      onValueChange={onSelectedChange}
    >
      <CommandList aria-label={label}>
        <CommandEmpty>{empty}</CommandEmpty>
        <CommandGroup heading={heading}>
          {items.map((item) => (
            <CommandItem
              key={item.id}
              value={item.id}
              onMouseDown={(event) => event.preventDefault()}
              onSelect={item.onSelect}
            >
              <span className="slash-icon">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <footer>
        <span>
          <Kbd>↑ ↓</Kbd> pour naviguer
        </span>
        <span>
          <Kbd>↵</Kbd> pour insérer
        </span>
      </footer>
    </Command>
  );
}
