import type { DatabaseState } from "./shared";
import { client } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PropertyForm } from "./property-form";

export function CreatePropertyDialog({
  panel,
  setPanel,
  pageId,
  metadata,
}: Pick<DatabaseState, "panel" | "setPanel" | "pageId" | "metadata">) {
  return (
    <Dialog
      open={panel === "property"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
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
            await client.databases.addProperty({ pageId, ...values });
            await metadata.refetch();
            setPanel("none");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
