import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
export function TrashDialog({
  open,
  workspaceId,
  canEdit,
  onRefresh,
  onClose,
}: {
  open: boolean;
  workspaceId: string;
  canEdit: boolean;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const trash = useQuery({
    queryKey: ["trash", workspaceId],
    queryFn: () => orpcClient.pages.list({ workspaceId, trash: true }),
    enabled: open,
  });
  const restore = async (id: string) => {
    try {
      await orpcClient.pages.trash({ id, restore: true });
      await trash.refetch();
      await onRefresh();
      toast.success("Page restaurée");
    } catch (e) {
      reportError(e);
    }
  };
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
          <DialogTitle>Corbeille</DialogTitle>
          <DialogDescription>
            Restaurez une page pour retrouver son contenu et ses sous-pages.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-auto">
          {trash.data
            ?.filter((p) => p.deletedAt)
            .map((page) => (
              <div className="list-row" key={page.id}>
                <span>{page.icon}</span>
                <span className="row-title">{page.title}</span>
                {canEdit && (
                  <Button
                    onClick={() => restore(page.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <RotateCcw size={13} />
                    Restaurer
                  </Button>
                )}
              </div>
            ))}
          {!trash.data?.length && (
            <div className="empty-state p-8">
              <Trash2 size={25} />
              <p>Votre corbeille est vide.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
