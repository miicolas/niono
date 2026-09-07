import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { ViewConfig } from "@/validators/databases";
import type { Database } from "./types";
export function UnsavedViewBanner({
  pageId,
  view,
  config,
  editable,
  onSaved,
  onReset,
}: {
  pageId: string;
  view: Database["views"][number] | undefined;
  config: ViewConfig;
  editable: boolean;
  onSaved: () => Promise<void>;
  onReset: () => void;
}) {
  return (
    <div className="view-unsaved">
      <span>Vue modifiée</span>
      {editable && (
        <button
          onClick={async () => {
            try {
              if (!view) {
                return;
              }
              await orpcClient.databases.saveView({
                pageId,
                id: view.id,
                name: view.name,
                config,
                expectedRevision: view.revision,
              });
              await onSaved();
            } catch (e) {
              reportError(e);
            }
          }}
          type="button"
        >
          Enregistrer la vue
        </button>
      )}
      <button onClick={onReset} type="button">
        Réinitialiser
      </button>
    </div>
  );
}
