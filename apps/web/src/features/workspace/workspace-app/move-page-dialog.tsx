import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type WorkspaceState } from "./shared";

export function MovePageDialog({
  moving,
  setMoving,
  move,
  pages,
}: Pick<WorkspaceState, "moving" | "setMoving" | "move" | "pages">) {
  return (
    <Dialog
      open={!!moving}
      onOpenChange={(v) => {
        if (!v) setMoving(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déplacer « {moving?.title} »</DialogTitle>
          <DialogDescription>
            La page héritera des accès de sa destination. Les restrictions
            propres à cette page restent applicables.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-auto">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="list-row w-full"
            onClick={() => moving && void move(moving.id, null)}
          >
            À la racine de l’espace
          </Button>
          {pages.data
            ?.filter((p) => p.id !== moving?.id)
            .map((p) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="list-row w-full"
                key={p.id}
                onClick={() => moving && void move(moving.id, p.id)}
              >
                {p.icon} {p.title}
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
