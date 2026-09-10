import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import { type PageState } from "./shared";
import { SaveFailureToast } from "./save-failure-toast";

export function PageSaveFailure({
  save,
  downloadDraft,
  canEdit,
  props,
  page,
  title,
  metadata,
  document,
  onReload,
}: Pick<
  PageState,
  | "save"
  | "downloadDraft"
  | "canEdit"
  | "props"
  | "page"
  | "title"
  | "metadata"
  | "document"
  | "onReload"
>) {
  return (
    <SaveFailureToast status={save.status}>
      {save.status === "conflict"
        ? "Une autre version de cette page a été enregistrée. Votre texte est conservé sur cet appareil."
        : "La sauvegarde n’a pas abouti. Votre brouillon est conservé sur cet appareil."}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={downloadDraft}>
          Télécharger mon brouillon
        </Button>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const copy = await client.pages.create({
                  workspaceId: props.workspaceId,
                  parentId: page.id,
                  title: `${title} — copie`,
                  icon: metadata.icon,
                  content: save.latest() ?? document.content,
                });
                await save.discard();
                await props.onRefresh();
                props.onNavigate(copy.id);
              } catch (error) {
                reportError(error);
              }
            }}
          >
            Créer une sous-page de secours
          </Button>
        )}
        {save.status !== "conflict" ? (
          <Button
            size="sm"
            disabled={save.status === "saving"}
            onClick={() => void save.flush()}
          >
            {save.status === "saving" ? "Enregistrement…" : "Réessayer"}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={async () => {
              downloadDraft();
              await save.discard();
              await onReload();
            }}
          >
            Recharger la version du serveur
          </Button>
        )}
      </div>
    </SaveFailureToast>
  );
}
