import type { DocumentNode } from "@/lib/editor/document-node";
import type { DocumentSave } from "@/routes/(application)/-lib/use-document-save";
import { DraftRecoveryBanner } from "./draft-recovery-banner";
import { SaveConflictBanner } from "./save-conflict-banner";

type Props = {
  save: DocumentSave;
  canEdit: boolean;
  /** Réinjecte le brouillon récupéré dans l'éditeur. */
  onApplyDraft: (content: DocumentNode) => void;
  onDownloadDraft: () => void;
  onCreateBackup: () => void;
  onReload: () => void;
};

export function PageSaveBanners({
  save,
  canEdit,
  onApplyDraft,
  onDownloadDraft,
  onCreateBackup,
  onReload,
}: Props) {
  return (
    <>
      {save.draftError && (
        <div className="conflict-banner">
          Le stockage local est indisponible. Téléchargez votre brouillon avant
          de quitter la page si la sauvegarde échoue.
        </div>
      )}
      {save.draft && (
        <DraftRecoveryBanner
          onIgnore={() => save.ignoreRecovered()}
          onRecover={() => {
            const content = save.recover();
            if (content) {
              onApplyDraft(content);
            }
          }}
        />
      )}
      {(save.status === "conflict" || save.status === "error") && (
        <SaveConflictBanner
          canEdit={canEdit}
          onCreateBackup={onCreateBackup}
          onDownloadDraft={onDownloadDraft}
          onReload={onReload}
          onRetry={() => save.flush()}
          status={save.status}
        />
      )}
    </>
  );
}
