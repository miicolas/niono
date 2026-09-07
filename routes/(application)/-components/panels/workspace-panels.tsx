import { useUI } from "@/lib/ui/store";
import type { Bootstrap } from "@/routes/(application)/-lib/types";
import { SearchDialog } from "./search-dialog";
import { SettingsDialog } from "./settings-dialog";
import { TemplatesDialog } from "./templates-dialog";
import { TrashDialog } from "./trash-dialog";
/** Hosts the workspace dialogs; the active one is picked from the UI store's `panel`. */
export function WorkspacePanels({
  workspaceId,
  bootstrap,
  onNavigate,
  onRefresh,
}: {
  workspaceId: string;
  bootstrap: Bootstrap;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const panel = useUI((s) => s.panel);
  const setPanel = useUI((s) => s.setPanel);
  const workspace = bootstrap.workspaces.find((w) => w.id === workspaceId);
  const isOwner = workspace?.role === "owner";
  const canEdit = workspace?.role !== "viewer";
  const close = () => setPanel("none");
  return (
    <>
      <SearchDialog
        onClose={close}
        onNavigate={onNavigate}
        open={panel === "search"}
        workspaceId={workspaceId}
      />
      <TrashDialog
        canEdit={canEdit}
        onClose={close}
        onRefresh={onRefresh}
        open={panel === "trash"}
        workspaceId={workspaceId}
      />
      <TemplatesDialog
        canEdit={canEdit}
        onClose={close}
        onNavigate={onNavigate}
        onRefresh={onRefresh}
        open={panel === "templates"}
        workspaceId={workspaceId}
      />
      <SettingsDialog
        canEdit={canEdit}
        isOwner={isOwner}
        onClose={close}
        onNavigate={onNavigate}
        onRefresh={onRefresh}
        open={panel === "settings"}
        user={bootstrap.user}
        workspaceId={workspaceId}
        workspaceName={workspace?.name}
      />
    </>
  );
}
