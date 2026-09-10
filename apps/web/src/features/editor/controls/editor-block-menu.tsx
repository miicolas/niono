import { Fragment, type ComponentProps } from "react";
import type { EditorUI } from "@digipm/editor/document-editor/editor-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function EditorBlockMenu({
  x,
  y,
  items,
  onClose,
  onRestoreFocus,
}: ComponentProps<EditorUI["BlockMenu"]>) {
  return (
    <DropdownMenu
      open
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden="true"
          style={{
            position: "fixed",
            left: x,
            top: y,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={0}
        collisionPadding={8}
        className="editor-context-menu w-64"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        {items.map((item, index) => {
          const startsSection = item.section !== items[index - 1]?.section;
          return (
            <Fragment key={item.id}>
              {startsSection && index > 0 && <DropdownMenuSeparator />}
              {startsSection && (
                <DropdownMenuLabel>
                  {item.section ?? "Actions"}
                </DropdownMenuLabel>
              )}
              <DropdownMenuItem
                onSelect={item.onSelect}
                variant={item.id === "delete" ? "destructive" : "default"}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.shortcut && (
                  <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
