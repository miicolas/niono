import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PageItem } from "@/routes/(application)/-lib/types";
export function MovePageDialog({
  page,
  pages,
  onSelect,
  onClose,
}: {
  page: PageItem | null;
  pages: PageItem[];
  onSelect: (parentId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={!!page}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déplacer « {page?.title} »</DialogTitle>
          <DialogDescription>
            La page héritera des accès de sa destination. Les restrictions
            propres à cette page restent applicables.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-auto">
          <button
            className="w-full list-row"
            onClick={() => onSelect(null)}
            type="button"
          >
            À la racine de l’espace
          </button>
          {pages
            .filter((p) => p.id !== page?.id)
            .map((p) => (
              <button
                className="w-full list-row"
                key={p.id}
                onClick={() => onSelect(p.id)}
                type="button"
              >
                {p.icon} {p.title}
              </button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
