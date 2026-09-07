import { useQuery } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { documentText } from "@/lib/editor/document-text";
import { orpcClient } from "@/orpc/client";
import type { PageData } from "@/routes/(application)/-lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  pageId: string;
  canEdit: boolean;
  /** Contenu affiché si la version sélectionnée n'est plus disponible. */
  fallbackContent: PageData["document"]["content"];
  onRestore: (versionId: string) => Promise<void>;
};

export function VersionHistoryDialog({
  open,
  onClose,
  pageId,
  canEdit,
  fallbackContent,
  onRestore,
}: Props) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const versions = useQuery({
    queryKey: ["versions", pageId],
    queryFn: () => orpcClient.documents.versions({ id: pageId }),
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
          <DialogTitle>Historique des versions</DialogTitle>
          <DialogDescription>
            Un instantané est conservé avant la première modification, puis au
            plus toutes les cinq minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-48 overflow-auto">
          {versions.data?.map((v) => (
            <button
              className="w-full list-row"
              key={v.id}
              onClick={() => setSelectedVersion(v.id)}
              type="button"
            >
              <Clock3 size={14} />
              <span>
                Version {v.revision} ·{" "}
                {new Date(v.createdAt).toLocaleString("fr-FR")}
              </span>
            </button>
          ))}
          {!versions.data?.length && (
            <p className="muted">
              Les versions apparaîtront après vos premières modifications.
            </p>
          )}
        </div>
        {selectedVersion && (
          <>
            <div className="version-preview">
              {documentText(
                versions.data?.find((v) => v.id === selectedVersion)?.content ??
                  fallbackContent
              )}
            </div>
            {canEdit && (
              <Button onClick={() => onRestore(selectedVersion)}>
                Restaurer cette version
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
