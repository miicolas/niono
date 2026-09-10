import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import { type DatabaseState } from "./shared";

export function DatabaseUnsavedView({
  localConfig,
  editable,
  savingView,
  selected,
  config,
  setSavingView,
  pageId,
  metadata,
  setLocalConfig,
  setOffset,
}: Pick<
  DatabaseState,
  | "localConfig"
  | "editable"
  | "savingView"
  | "selected"
  | "config"
  | "setSavingView"
  | "pageId"
  | "metadata"
  | "setLocalConfig"
  | "setOffset"
>) {
  return (
    localConfig && (
      <div className="view-unsaved">
        <span>Vue modifiée</span>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={savingView}
            onClick={async () => {
              if (!selected || savingView) return;
              const savedConfig = config;
              setSavingView(true);
              try {
                await client.databases.saveView({
                  pageId,
                  id: selected.id,
                  name: selected.name,
                  config,
                  expectedRevision: selected.revision,
                });
                await metadata.refetch();
                setLocalConfig((current) =>
                  current === savedConfig ? null : current,
                );
              } catch (e) {
                reportError(e);
              } finally {
                setSavingView(false);
              }
            }}
          >
            Enregistrer la vue
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            setLocalConfig(null);
            setOffset(0);
          }}
        >
          Réinitialiser
        </Button>
      </div>
    )
  );
}
