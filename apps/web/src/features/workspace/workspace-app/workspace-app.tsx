import { CodexProvider } from "../../codex/codex-context";
import { CodexPanel } from "../../codex/codex-panel";
import { reportError } from "@/lib/notifications";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RequestError } from "@/components/content-state";
import { WorkspaceSkeleton } from "@/components/loading-state";
import { authClient, authResult } from "@/lib/auth-client";
import { PageView } from "../page-view";
import { WorkspacePanels } from "../workspace-panels";
import { type WorkspaceAppProps } from "./shared";
import { useWorkspace } from "./use-workspace";
import { WorkspaceTopbar } from "./workspace-topbar";
import { WorkspaceHome } from "./workspace-home";
import { MoveAudienceDialog } from "./move-audience-dialog";
import { MovePageDialog } from "./move-page-dialog";

export function WorkspaceApp(props: WorkspaceAppProps) {
  const {
    realtimeConnected,
    bootstrap,
    pages,
    pageId,
    workspaceId,
    go,
    create,
    cache,
    action,
    move,
    beforeLeave,
    navigate,
    theme,
    setTheme,
    refresh,
    recent,
    pendingMove,
    setPendingMove,
    moving,
    setMoving,
  } = useWorkspace(props);
  if (bootstrap.isPending && bootstrap.fetchStatus !== "paused")
    return <WorkspaceSkeleton />;
  if (!bootstrap.data)
    return (
      <RequestError
        fullPage
        error={bootstrap.error}
        title="Votre espace est momentanément indisponible"
        description="Nous n’avons pas pu ouvrir votre espace. Réessayez pour retrouver vos pages."
        onRetry={() => void bootstrap.refetch()}
        retrying={bootstrap.isFetching}
      />
    );
  const current = pages.data?.find((p) => p.id === pageId);
  const workspace = bootstrap.data.workspaces.find((w) => w.id === workspaceId);
  return (
    <CodexProvider key={`${bootstrap.data.user.id}:${workspaceId}`}>
      <SidebarProvider
        style={{ "--sidebar-width": "250px" } as React.CSSProperties}
      >
        <AppSidebar
          pages={pages.data ?? []}
          pagesLoading={pages.isPending && pages.fetchStatus !== "paused"}
          pagesUnavailable={pages.isError || pages.fetchStatus === "paused"}
          currentId={pageId}
          workspaceId={workspaceId!}
          bootstrap={bootstrap.data}
          onNavigate={(id) => void go(id)}
          onCreate={(parent, kind) => void create(parent, kind)}
          onWorkspace={(id) => void go(null, id)}
          onNewWorkspace={async (name) => {
            try {
              const w = authResult(
                await authClient.organization.create({
                  name,
                  slug: `espace-${crypto.randomUUID()}`,
                }),
              );
              await cache.invalidateQueries({ queryKey: ["bootstrap"] });
              await go(null, w.id);
            } catch (e) {
              reportError(e);
              throw e;
            }
          }}
          onAction={(a, p) => void action(a, p)}
          onMove={(id, parent, before) => void move(id, parent, before)}
          onLogout={async () => {
            if (beforeLeave.current && !(await beforeLeave.current())) return;
            await authClient.signOut();
            cache.clear();
            await navigate({ to: "/login" });
          }}
        />
        <SidebarInset className="app-main">
          <div className="workspace-realtime-status" role="status">
            {realtimeConnected ? "● En direct" : "○ Reconnexion…"}
          </div>
          <WorkspaceTopbar
            go={go}
            workspace={workspace}
            current={current}
            pages={pages}
            theme={theme}
            setTheme={setTheme}
          />
          <div className="document-scroll">
            {pages.error || (!pages.data && pages.fetchStatus === "paused") ? (
              <RequestError
                error={pages.error}
                title="Impossible de charger les pages"
                description="Vos pages n’ont pas pu être récupérées. Relancez le chargement pour continuer."
                onRetry={() => void pages.refetch()}
                retrying={pages.isFetching}
              />
            ) : pageId ? (
              <PageView
                key={pageId}
                pageId={pageId}
                workspaceId={workspaceId!}
                user={bootstrap.data.user}
                pages={pages.data ?? []}
                onRefresh={refresh}
                onNavigate={(id) => void go(id)}
                beforeLeave={beforeLeave}
                onHome={() => void go(null)}
                onAction={(a) => {
                  if (current) void action(a, current);
                }}
              />
            ) : (
              <WorkspaceHome
                bootstrap={bootstrap}
                recent={recent}
                go={go}
                workspace={workspace}
                create={create}
              />
            )}
          </div>
        </SidebarInset>
        <WorkspacePanels
          workspaceId={workspaceId!}
          bootstrap={bootstrap.data}
          onNavigate={(id) => void go(id)}
          onRefresh={refresh}
        />
        <MoveAudienceDialog
          pendingMove={pendingMove}
          setPendingMove={setPendingMove}
          move={move}
        />
        <MovePageDialog
          moving={moving}
          setMoving={setMoving}
          move={move}
          pages={pages}
        />
        <CodexPanel
          userId={bootstrap.data.user.id}
          workspaceId={workspaceId!}
          pageId={pageId}
          pageTitle={current?.title}
        />
      </SidebarProvider>
    </CodexProvider>
  );
}
