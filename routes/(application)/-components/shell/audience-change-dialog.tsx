import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PendingMove } from "@/routes/(application)/-lib/use-page-move";
export function AudienceChangeDialog({
  pending,
  onConfirm,
  onClose,
}: {
  pending: PendingMove | null;
  onConfirm: (pending: PendingMove) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={!!pending}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ce déplacement ouvre de nouveaux accès</DialogTitle>
          <DialogDescription>
            Ces membres pourront accéder à la page et aux sous-pages qui
            héritent de ses accès.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 overflow-auto">
          {pending?.audience.map((person) => (
            <div className="settings-row" key={person.id}>
              <span>{person.name}</span>
              <span className="muted">
                {person.access === "edit" ? "Modification" : "Lecture"}
              </span>
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            if (pending) {
              onConfirm(pending);
            }
          }}
        >
          Confirmer le déplacement et les accès
        </Button>
        <Button onClick={onClose} variant="outline">
          Annuler
        </Button>
      </DialogContent>
    </Dialog>
  );
}
