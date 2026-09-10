import type { ComponentProps } from "react";
import type { EditorUI } from "@digipm/editor/document-editor/editor-ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export function EditorPopover({
  open,
  onOpenChange,
  trigger,
  children,
  label,
  onRestoreFocus,
}: ComponentProps<EditorUI["Popover"]>) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-80"
        aria-label={label}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
