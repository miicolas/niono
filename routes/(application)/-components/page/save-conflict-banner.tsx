import { Button } from "@/components/ui/button";

type Props = {
  status: "conflict" | "error";
  canEdit: boolean;
  onDownloadDraft: () => void;
  onCreateBackup: () => void;
  onRetry: () => void;
  onReload: () => void;
};

export function SaveConflictBanner({
  status,
  canEdit,
  onDownloadDraft,
  onCreateBackup,
  onRetry,
  onReload,
}: Props) {
  return (
    <div className="conflict-banner">
      {status === "conflict"
        ? "Une autre version de cette page a été enregistrée. Votre texte est conservé sur cet appareil."
        : "La sauvegarde n’a pas abouti. Votre brouillon est conservé sur cet appareil."}
      <div className="actions">
        <Button onClick={onDownloadDraft} size="sm" variant="outline">
          Télécharger mon brouillon
        </Button>
        {canEdit && (
          <Button onClick={onCreateBackup} size="sm" variant="outline">
            Créer une sous-page de secours
          </Button>
        )}
        {status === "error" ? (
          <Button onClick={onRetry} size="sm">
            Réessayer
          </Button>
        ) : (
          <Button onClick={onReload} size="sm">
            Recharger la version du serveur
          </Button>
        )}
      </div>
    </div>
  );
}
