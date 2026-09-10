import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type DatabaseState } from "./shared";

export function ViewOptionsDialog({
  panel,
  setPanel,
  config,
  setConfig,
  properties,
}: Pick<
  DatabaseState,
  "panel" | "setPanel" | "config" | "setConfig" | "properties"
>) {
  return (
    <Dialog
      open={panel === "options"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Options de la vue</DialogTitle>
          <DialogDescription>
            Choisissez la propriété de groupement du tableau ou du calendrier.
          </DialogDescription>
        </DialogHeader>

        <div className="panel-form">
          <Label className="grid gap-2">
            Grouper / propriété du calendrier
            <SelectField
              value={config.groupBy ?? ""}
              onValueChange={(value) =>
                setConfig({ ...config, groupBy: value || undefined })
              }
              emptyLabel="Automatique"
            >
              {properties
                .filter((p) => ["status", "select", "date"].includes(p.type))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectField>
          </Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
