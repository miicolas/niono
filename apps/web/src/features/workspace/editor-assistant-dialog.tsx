import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EditorAssistantDialog({
  children,
  onClose,
  onRestoreFocus,
}: {
  children: ReactNode;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Assistant d’écriture</DialogTitle>
          <DialogDescription>
            Un coup de pouce pour vos idées, à partir du texte sélectionné.
          </DialogDescription>
        </DialogHeader>
        <div className="ai-panel">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
