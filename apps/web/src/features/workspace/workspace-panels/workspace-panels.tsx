import { SettingsDialog } from "../settings-dialog";
import { type WorkspacePanelsProps } from "./shared";
import { useWorkspacePanels } from "./use-workspace-panels";
import { SearchDialog } from "./search-dialog";
import { TrashDialog } from "./trash-dialog";
import { TemplatesDialog } from "./templates-dialog";

export function WorkspacePanels(props: WorkspacePanelsProps) {
  const {
    panel,
    close,
    searchInput,
    query,
    setQuery,
    debounced,
    results,
    onNavigate,
    setDebounced,
    trash,
    canEdit,
    onRefresh,
    templates,
    busy,
    setBusy,
    workspaceId,
    bootstrap,
  } = useWorkspacePanels(props);
  return (
    <>
      <SearchDialog
        panel={panel}
        close={close}
        searchInput={searchInput}
        query={query}
        setQuery={setQuery}
        debounced={debounced}
        results={results}
        onNavigate={onNavigate}
        setDebounced={setDebounced}
      />
      <TrashDialog
        panel={panel}
        close={close}
        trash={trash}
        canEdit={canEdit}
        onRefresh={onRefresh}
      />
      <TemplatesDialog
        panel={panel}
        close={close}
        templates={templates}
        canEdit={canEdit}
        busy={busy}
        setBusy={setBusy}
        workspaceId={workspaceId}
        onRefresh={onRefresh}
        onNavigate={onNavigate}
      />
      <SettingsDialog
        key={workspaceId}
        open={panel === "settings"}
        onClose={close}
        workspaceId={workspaceId}
        bootstrap={bootstrap}
        onImported={async (id) => {
          await onRefresh();
          onNavigate(id);
          close();
        }}
      />
    </>
  );
}
