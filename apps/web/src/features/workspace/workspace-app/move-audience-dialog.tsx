import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type WorkspaceState } from "./shared";

export function MoveAudienceDialog({
  pendingMove,
  setPendingMove,
  move,
}: Pick<WorkspaceState, "pendingMove" | "setPendingMove" | "move">) {
  return (
    <Dialog
      open={!!pendingMove}
      onOpenChange={(v) => {
        if (!v) setPendingMove(null);
      }}
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
          {pendingMove?.audience.map((person) => (
            <div className="settings-row" key={person.id}>
              <span>{person.name}</span>
              <span className="muted">
                {person.access === "edit" ? "Modification" : "Lecture"}
              </span>
            </div>
          ))}
        </div>
        <Button
          onClick={() =>
            pendingMove &&
            void move(
              pendingMove.id,
              pendingMove.parentId,
              pendingMove.beforeId,
              true,
              pendingMove.audience,
            )
          }
        >
          Confirmer le déplacement et les accès
        </Button>
        <Button variant="outline" onClick={() => setPendingMove(null)}>
          Annuler
        </Button>
      </DialogContent>
    </Dialog>
  );
}
