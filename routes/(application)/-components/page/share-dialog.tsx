import { useQuery } from "@tanstack/react-query";
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
import type { ShareGrant } from "@/routes/(application)/-lib/types";
import { ShareForm } from "./share-form";

type Props = {
  open: boolean;
  onClose: () => void;
  pageId: string;
  workspaceId: string;
  /** Identifiant de l'utilisateur connecté ; seul le créateur gère les accès. */
  userId: string;
  createdBy: string;
  privateRoot: boolean;
  grants: ShareGrant[];
  onDone: () => Promise<void>;
};

function copyLink() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() =>
      import("sonner").then(({ toast }) => toast.success("Lien copié"))
    )
    .catch(reportError);
}

export function ShareDialog({
  open,
  onClose,
  pageId,
  workspaceId,
  userId,
  createdBy,
  privateRoot,
  grants,
  onDone,
}: Props) {
  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => orpcClient.workspaces.members({ workspaceId }),
    enabled: open,
  });
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
          <DialogTitle>Partager cette page</DialogTitle>
          <DialogDescription>
            {privateRoot
              ? "Cette page est restreinte."
              : "Les membres autorisés de l’espace ont accès à cette page."}{" "}
            Les accès de ses pages parentes s’appliquent également.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={copyLink} variant="outline">
          Copier le lien
        </Button>
        {createdBy === userId && (
          <ShareForm
            grants={grants}
            isPrivate={privateRoot}
            members={members.data ?? []}
            onDone={onDone}
            pageId={pageId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
