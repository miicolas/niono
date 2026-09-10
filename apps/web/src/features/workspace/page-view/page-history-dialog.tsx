import { documentText } from "@digipm/contracts";
import { Clock3 } from "lucide-react";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { reportError } from "@/lib/notifications";
import { type PageState } from "./shared";

export function PageHistoryDialog({
  panel,
  setPanel,
  versions,
  setSelectedVersion,
  selectedVersion,
  document,
  canEdit,
  save,
  page,
  onReload,
  cache,
}: Pick<
  PageState,
  | "panel"
  | "setPanel"
  | "versions"
  | "setSelectedVersion"
  | "selectedVersion"
  | "document"
  | "canEdit"
  | "save"
  | "page"
  | "onReload"
  | "cache"
>) {
  return (
    <Dialog
      open={panel === "history"}
      onOpenChange={(v) => {
        if (!v) setPanel("none");
      }}
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
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="list-row w-full"
              key={v.id}
              onClick={() => setSelectedVersion(v.id)}
            >
              <Clock3 size={14} />
              <span>
                Version {v.revision} ·{" "}
                {new Date(v.createdAt).toLocaleString("fr-FR")}
              </span>
            </Button>
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
                  document.content,
              )}
            </div>
            {canEdit && (
              <Button
                onClick={async () => {
                  try {
                    await save.flush();
                    if (save.dirty())
                      throw new Error(
                        "Résolvez la sauvegarde en cours avant de restaurer.",
                      );
                    await client.pages.restore({
                      id: page.id,
                      versionId: selectedVersion,
                      expectedRevision: save.revision(),
                    });
                    await onReload();
                    await cache.invalidateQueries({
                      queryKey: ["versions", page.id],
                    });
                  } catch (e) {
                    reportError(e);
                  }
                }}
              >
                Restaurer cette version
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
