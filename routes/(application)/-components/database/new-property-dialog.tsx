import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orpcClient } from "@/orpc/client";
import { PropertyForm } from "./property-form";
export function NewPropertyDialog({
  open,
  pageId,
  onClose,
  onAdded,
}: {
  open: boolean;
  pageId: string;
  onClose: () => void;
  onAdded: () => Promise<unknown>;
}) {
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle propriété</DialogTitle>
          <DialogDescription>
            Ajoutez une information à toutes les pages de cette base.
          </DialogDescription>
        </DialogHeader>
        <PropertyForm
          onSubmit={async (values) => {
            await orpcClient.databases.addProperty({ pageId, ...values });
            await onAdded();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
