import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { viewSchema } from "@digipm/contracts";
import { client } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type DatabaseState, layouts } from "./shared";

export function CreateViewDialog({
  panel,
  setPanel,
  pageId,
  properties,
  metadata,
  setViewId,
  setLocalConfig,
}: Pick<
  DatabaseState,
  | "panel"
  | "setPanel"
  | "pageId"
  | "properties"
  | "metadata"
  | "setViewId"
  | "setLocalConfig"
>) {
  return (
    <Dialog
      open={panel === "view"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Une nouvelle perspective</DialogTitle>
          <DialogDescription>
            Les vues présentent les mêmes pages sous différentes formes.
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          schema={z.object({
            name: z.string().trim().min(1, "Saisissez un nom.").max(100),
            layout: z.enum([
              "table",
              "board",
              "list",
              "gallery",
              "calendar",
              "chart",
            ]),
          })}
          defaultValues={{ name: "", layout: "table" }}
          fields={[
            { name: "name", label: "Nom de la vue", maxLength: 100 },
            {
              name: "layout",
              label: "Disposition",
              options: layouts.map((layout) => ({
                value: layout.id,
                label: layout.name,
              })),
            },
          ]}
          submitLabel="Créer la vue"
          onSubmit={async ({ name, layout }) => {
            const view = await client.databases.saveView({
              pageId,
              name,
              config: viewSchema.parse({
                layout,
                ...(layout === "chart"
                  ? {
                      chart: {
                        xProperty:
                          properties.find((p) =>
                            ["status", "select"].includes(p.type),
                          )?.id ?? "title",
                      },
                    }
                  : {}),
              }),
            });
            await metadata.refetch();
            setViewId(view.id);
            setLocalConfig(null);
            setPanel("none");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
