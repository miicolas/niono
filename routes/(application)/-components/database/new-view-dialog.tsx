import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import { viewSchema } from "@/validators/databases";
import { layouts } from "./layouts";
export function NewViewDialog({
  open,
  pageId,
  onClose,
  onCreated,
}: {
  open: boolean;
  pageId: string;
  onClose: () => void;
  onCreated: (viewId: string) => Promise<void>;
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
          <DialogTitle>Une nouvelle perspective</DialogTitle>
          <DialogDescription>
            Les vues présentent les mêmes pages sous différentes formes.
          </DialogDescription>
        </DialogHeader>
        <form
          className="panel-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              const view = await orpcClient.databases.saveView({
                pageId,
                name: String(f.get("name")),
                config: viewSchema.parse({ layout: f.get("layout") }),
              });
              await onCreated(view.id);
            } catch (error) {
              reportError(error);
            }
          }}
        >
          <Input
            aria-label="Nom de la vue"
            maxLength={100}
            name="name"
            placeholder="Nom de la vue"
            required
          />
          <select aria-label="Disposition" name="layout">
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <Button>Créer la vue</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
