import { ContentState, RequestError } from "@/components/content-state";
import { ListSkeleton } from "@/components/loading-state";
import { Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import { type WorkspacePanelsState } from "./shared";

export function TrashDialog({
  panel,
  close,
  trash,
  canEdit,
  onRefresh,
}: Pick<
  WorkspacePanelsState,
  "panel" | "close" | "trash" | "canEdit" | "onRefresh"
>) {
  return (
    <Dialog
      open={panel === "trash"}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corbeille</DialogTitle>
          <DialogDescription>
            Restaurez une page pour retrouver son contenu et ses sous-pages.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-auto">
          {trash.error || trash.fetchStatus === "paused" ? (
            <RequestError
              compact
              error={trash.error}
              title="Impossible d’ouvrir la corbeille"
              description="Les pages supprimées n’ont pas pu être récupérées. Réessayez dans quelques instants."
              onRetry={() => void trash.refetch()}
              retrying={trash.isFetching}
            />
          ) : trash.isPending ? (
            <ListSkeleton label="Ouverture de la corbeille…" />
          ) : trash.data?.some((page) => page.deletedAt) ? (
            trash.data
              ?.filter((p) => p.deletedAt)
              .map((page) => (
                <div className="list-row" key={page.id}>
                  <span>{page.icon}</span>
                  <span className="row-title">{page.title}</span>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await client.pages.trash({
                            id: page.id,
                            restore: true,
                          });
                          await trash.refetch();
                          await onRefresh();
                          toast.success("Page restaurée");
                        } catch (e) {
                          reportError(e);
                        }
                      }}
                    >
                      <RotateCcw size={13} />
                      Restaurer
                    </Button>
                  )}
                </div>
              ))
          ) : (
            <ContentState
              compact
              icon={Trash2}
              title="Votre corbeille est vide"
              description="Les pages supprimées apparaîtront ici. Vous pourrez les restaurer à tout moment."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
