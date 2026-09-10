import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { withoutProperty } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/notifications";
import { type DatabaseState } from "./shared";

export function PropertyActionDialog({
  propertyAction,
  busy,
  setPropertyAction,
  setBusy,
  pageId,
  setLocalConfig,
  metadata,
  refresh,
}: Pick<
  DatabaseState,
  | "propertyAction"
  | "busy"
  | "setPropertyAction"
  | "setBusy"
  | "pageId"
  | "setLocalConfig"
  | "metadata"
  | "refresh"
>) {
  return (
    <Dialog
      open={!!propertyAction}
      onOpenChange={(open) => {
        if (!open && !busy) setPropertyAction(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {propertyAction?.action === "delete"
              ? "Supprimer la propriété ?"
              : "Renommer la propriété"}
          </DialogTitle>
          <DialogDescription>
            {propertyAction?.action === "delete"
              ? `« ${propertyAction.property.name} » et ses valeurs seront supprimées de toutes les pages et vues de cette base. Cette action est irréversible. Pour conserver les données, utilisez « Masquer dans cette vue ».`
              : "Le nouveau nom apparaîtra dans toutes les vues de cette base."}
          </DialogDescription>
        </DialogHeader>
        {propertyAction && (
          <>
            <ActionForm
              key={propertyAction.property.id + propertyAction.action}
              schema={z.object({
                name: z.string().trim().min(1, "Saisissez un nom.").max(100),
              })}
              defaultValues={{ name: propertyAction.property.name }}
              fields={
                propertyAction.action === "rename"
                  ? [
                      {
                        name: "name",
                        label: "Nouveau nom de la propriété",
                        maxLength: 100,
                      },
                    ]
                  : []
              }
              submitLabel={
                propertyAction.action === "delete"
                  ? "Supprimer définitivement"
                  : "Renommer"
              }
              submitVariant={
                propertyAction.action === "delete" ? "destructive" : "default"
              }
              onSubmit={async ({ name }) => {
                const action = propertyAction;
                setBusy(true);
                try {
                  const input = {
                    pageId,
                    propertyId: action.property.id,
                    expectedName: action.property.name,
                  };
                  if (action.action === "rename")
                    await client.databases.renameProperty({
                      ...input,
                      name,
                    });
                  else {
                    await client.databases.deleteProperty(input);
                    setLocalConfig((current) =>
                      current
                        ? withoutProperty(current, action.property.id)
                        : null,
                    );
                  }
                  await metadata.refetch();
                  await refresh();
                  setPropertyAction(null);
                } catch (error) {
                  reportError(error);
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setPropertyAction(null)}
            >
              Annuler
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
