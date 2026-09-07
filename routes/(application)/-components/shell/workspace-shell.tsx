import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PAGES } from "@/constants/pages";
import { authClient } from "@/lib/auth/client";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import { PageView } from "@/routes/(application)/-components/page/page-view";
import { WorkspacePanels } from "@/routes/(application)/-components/panels/workspace-panels";
import { AppSidebar } from "@/routes/(application)/-components/sidebar/app-sidebar";
import type { Bootstrap } from "@/routes/(application)/-lib/types";
import { useKeyboardShortcuts } from "@/routes/(application)/-lib/use-keyboard-shortcuts";
import { useLeaveGuard } from "@/routes/(application)/-lib/use-leave-guard";
import { usePageActions } from "@/routes/(application)/-lib/use-page-actions";
import { usePageMove } from "@/routes/(application)/-lib/use-page-move";
import { useWorkspaceNavigation } from "@/routes/(application)/-lib/use-workspace-navigation";
import {
  bootstrapQuery,
  pagesQuery,
} from "@/routes/(application)/-lib/workspace-queries";
import { AudienceChangeDialog } from "./audience-change-dialog";
import { MovePageDialog } from "./move-page-dialog";
import { WorkspaceHome } from "./workspace-home";
import { WorkspaceTopbar } from "./workspace-topbar";
/** The signed-in workspace: sidebar, topbar, page or home, and every dialog. */
export function WorkspaceShell({
  bootstrap,
  workspaceId,
  pageId,
}: {
  bootstrap: Bootstrap;
  workspaceId: string;
  pageId: string | null;
}) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const pages = useQuery(pagesQuery(workspaceId));
  const pageList = pages.data ?? [];
  const beforeLeave = useLeaveGuard();
  useKeyboardShortcuts();
  const { refresh, go, create } = useWorkspaceNavigation({
    workspaceId,
    beforeLeave,
  });
  const move = usePageMove({ refresh });
  const action = usePageActions({
    workspaceId,
    pageId,
    pages: pageList,
    beforeLeave,
    go,
    refresh,
    startMove: move.startMove,
  });
  const logout = async () => {
    if (beforeLeave.current && !(await beforeLeave.current())) {
      return;
    }
    await authClient.signOut();
    cache.clear();
    await navigate({ to: PAGES.SIGN_IN });
  };
  const createWorkspace = async (name: string) => {
    try {
      const w = await orpcClient.workspaces.create({ name });
      await cache.invalidateQueries({ queryKey: bootstrapQuery().queryKey });
      await go(null, w.id);
    } catch (e) {
      reportError(e);
      throw e;
    }
  };
  const current = pageList.find((p) => p.id === pageId);
  const workspace = bootstrap.workspaces.find((w) => w.id === workspaceId);
  let content = (
    <WorkspaceHome
      canCreate={workspace?.role !== "viewer"}
      onCreate={(kind) => create(undefined, kind)}
      onOpen={(id) => go(id)}
      userName={bootstrap.user.name}
      workspaceId={workspaceId}
    />
  );
  if (pages.error) {
    content = (
      <div className="empty-state">
        <p>{pages.error.message}</p>
        <Button onClick={() => pages.refetch()}>Réessayer</Button>
      </div>
    );
  } else if (pageId) {
    content = (
      <PageView
        beforeLeave={beforeLeave}
        key={pageId}
        onAction={(a) => {
          if (current) {
            action(a, current);
          }
        }}
        onNavigate={(id) => go(id)}
        onRefresh={refresh}
        pageId={pageId}
        pages={pageList}
        user={bootstrap.user}
        workspaceId={workspaceId}
      />
    );
  }
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "250px" } as React.CSSProperties}
    >
      <AppSidebar
        bootstrap={bootstrap}
        currentId={pageId}
        onAction={action}
        onCreate={create}
        onLogout={logout}
        onMove={(id, parentId, beforeId) =>
          move.requestMove({ id, parentId, beforeId })
        }
        onNavigate={(id) => go(id)}
        onNewWorkspace={createWorkspace}
        onWorkspace={(id) => go(null, id)}
        pages={pageList}
        workspaceId={workspaceId}
      />
      <SidebarInset className="app-main">
        <WorkspaceTopbar
          current={current}
          onNavigate={(id) => go(id)}
          pages={pageList}
          workspaceName={workspace?.name}
        />
        <div className="document-scroll">{content}</div>
      </SidebarInset>
      <WorkspacePanels
        bootstrap={bootstrap}
        onNavigate={(id) => go(id)}
        onRefresh={refresh}
        workspaceId={workspaceId}
      />
      <AudienceChangeDialog
        onClose={move.cancelPendingMove}
        onConfirm={(pending) => move.commitMove(pending, pending.audience)}
        pending={move.pendingMove}
      />
      <MovePageDialog
        onClose={move.cancelMove}
        onSelect={(parentId) => {
          if (move.moving) {
            move.requestMove({ id: move.moving.id, parentId });
          }
        }}
        page={move.moving}
        pages={pageList}
      />
    </SidebarProvider>
  );
}
