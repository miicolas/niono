import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock3,
  FileText,
  Moon,
  Plus,
  Sun,
  Table2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { reportError } from "@/lib/ui/notifications";
import { useUI } from "@/lib/ui/store";
import { orpcClient } from "@/orpc/client";
import { PageView } from "./page-view";
import { sortedFavorites } from "./sorted-favorites";
import type { PageItem } from "./types";
import { WorkspacePanels } from "./workspace-panels";
export type WorkspaceSearch = {
  w?: string;
  p?: string;
  view?: string;
  invite?: string;
};
export function WorkspaceApp({ search }: { search: WorkspaceSearch }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const bootstrap = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => orpcClient.workspaces.bootstrap(),
    retry: false,
  });
  const workspaceId = search.w ?? bootstrap.data?.workspaceId;
  const pageId = search.p ?? null;
  const pages = useQuery({
    queryKey: ["pages", workspaceId],
    queryFn: () => orpcClient.pages.list({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
  });
  const recent = useQuery({
    queryKey: ["recent", workspaceId],
    queryFn: () => orpcClient.pages.recent({ workspaceId: workspaceId! }),
    enabled: !!workspaceId && !pageId,
  });
  const [moving, setMoving] = useState<PageItem | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    id: string;
    parentId: string | null;
    beforeId?: string;
    audience: { id: string; name: string; access: "edit" | "read" }[];
  } | null>(null);
  const beforeLeave = useRef<
    null | ((requireSaved?: boolean) => Promise<boolean>)
  >(null);
  useBlocker({
    enableBeforeUnload: false,
    shouldBlockFn: async ({ current, next }) => {
      if (
        current.routeId === "/" &&
        next.routeId === "/" &&
        current.search.p === next.search.p &&
        current.search.w === next.search.w
      ) {
        return false;
      }
      return beforeLeave.current ? !(await beforeLeave.current()) : false;
    },
  });
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const setPanel = useUI((s) => s.setPanel);
  useEffect(() => {
    const value = localStorage.getItem("digipm-theme");
    setTheme(value === "light" ? "light" : "dark");
  }, [setTheme]);
  useEffect(() => {
    if (
      bootstrap.error &&
      "code" in bootstrap.error &&
      bootstrap.error.code === "UNAUTHORIZED"
    ) {
      void navigate({ to: "/login" });
    }
  }, [bootstrap.error, navigate]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [setPanel]);
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: ["pages", workspaceId] });
  };
  const go = async (id: string | null, w = workspaceId) => {
    if (beforeLeave.current && !(await beforeLeave.current())) {
      return;
    }
    await navigate({
      to: "/",
      search: { w, p: id ?? undefined },
      ignoreBlocker: true,
    });
    await cache.invalidateQueries({ queryKey: ["recent", w] });
    setPanel("none");
  };
  const create = async (
    parentId?: string,
    kind: "page" | "database" = "page"
  ) => {
    try {
      const page = await orpcClient.pages.create({
        workspaceId: workspaceId!,
        parentId,
        kind,
      });
      await refresh();
      await go(page.id);
    } catch (e) {
      reportError(e);
    }
  };
  type MoveTarget = { id: string; parentId: string | null; beforeId?: string };
  /** Performs the move; `audience` is the list of people the user confirmed will gain access. */
  const commitMove = async (
    target: MoveTarget,
    audience?: { id: string; access: "edit" | "read" }[]
  ) => {
    try {
      await orpcClient.pages.move({
        ...target,
        confirmAudienceChange: !!audience,
        confirmedAudience: audience,
      });
      setPendingMove(null);
      await cache.invalidateQueries({ queryKey: ["page", target.id] });
      await refresh();
      setMoving(null);
    } catch (e) {
      reportError(e);
    }
  };
  /** Previews the audience change and asks for confirmation before moving when someone gains access. */
  const requestMove = async (target: MoveTarget) => {
    try {
      const preview = await orpcClient.pages.previewMove({
        id: target.id,
        parentId: target.parentId,
      });
      if (preview.audience.length) {
        setPendingMove({ ...target, audience: preview.audience });
        return;
      }
    } catch (e) {
      reportError(e);
      return;
    }
    await commitMove(target);
  };
  const action = async (action: string, page: PageItem) => {
    try {
      if (action === "move") {
        setMoving(page);
        return;
      }
      if (action === "favorite-up") {
        const favorites = sortedFavorites(pages.data ?? []);
        const at = favorites.findIndex((p) => p.id === page.id);
        if (at > 0) {
          [favorites[at - 1], favorites[at]] = [
            favorites[at]!,
            favorites[at - 1]!,
          ];
          await orpcClient.pages.reorderFavorites({
            workspaceId: workspaceId!,
            ids: favorites.map((p) => p.id),
          });
        }
        await refresh();
        return;
      }
      if (action === "favorite") {
        await orpcClient.pages.favorite({
          id: page.id,
          enabled: !page.favorite,
        });
      }
      if (action === "duplicate") {
        if (
          pageId === page.id &&
          beforeLeave.current &&
          !(await beforeLeave.current(true))
        ) {
          return;
        }
        const result = await orpcClient.pages.duplicate({ id: page.id });
        await refresh();
        await go(result.id);
        return;
      }
      if (action === "trash") {
        if (
          pageId === page.id &&
          beforeLeave.current &&
          !(await beforeLeave.current())
        ) {
          return;
        }
        await orpcClient.pages.trash({ id: page.id });
        if (pageId === page.id) {
          await go(null);
        }
        toast("Page placée dans la corbeille", {
          action: {
            label: "Annuler",
            onClick: async () => {
              await orpcClient.pages.trash({ id: page.id, restore: true });
              await refresh();
            },
          },
        });
      }
      await refresh();
    } catch (e) {
      reportError(e);
    }
  };
  if (bootstrap.isPending) {
    return (
      <div className="empty-state">
        <span className="brand-mark">D</span>
        <p>Ouverture de votre espace…</p>
      </div>
    );
  }
  if (!bootstrap.data) {
    return (
      <div className="empty-state">
        <h1>Votre espace est indisponible</h1>
        <p>{bootstrap.error?.message}</p>
        <Button onClick={() => void bootstrap.refetch()}>Réessayer</Button>
      </div>
    );
  }
  const current = pages.data?.find((p) => p.id === pageId);
  const workspace = bootstrap.data.workspaces.find((w) => w.id === workspaceId);
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "250px" } as React.CSSProperties}
    >
      <AppSidebar
        bootstrap={bootstrap.data}
        currentId={pageId}
        onAction={(a, p) => void action(a, p)}
        onCreate={(parent, kind) => void create(parent, kind)}
        onLogout={async () => {
          if (beforeLeave.current && !(await beforeLeave.current())) {
            return;
          }
          await authClient.signOut();
          cache.clear();
          await navigate({ to: "/login" });
        }}
        onMove={(id, parentId, beforeId) =>
          void requestMove({ id, parentId, beforeId })
        }
        onNavigate={(id) => void go(id)}
        onNewWorkspace={async (name) => {
          try {
            const w = await orpcClient.workspaces.create({ name });
            await cache.invalidateQueries({ queryKey: ["bootstrap"] });
            await go(null, w.id);
          } catch (e) {
            reportError(e);
            throw e;
          }
        }}
        onWorkspace={(id) => void go(null, id)}
        pages={pages.data ?? []}
        workspaceId={workspaceId!}
      />
      <SidebarInset className="app-main">
        <header className="topbar">
          <SidebarTrigger />
          <nav aria-label="Fil d’Ariane" className="breadcrumbs">
            <button onClick={() => void go(null)}>{workspace?.name}</button>
            {current && (
              <>
                <span>/</span>
                {current.parentId && (
                  <>
                    <button onClick={() => void go(current.parentId)}>
                      {pages.data?.find((p) => p.id === current.parentId)
                        ?.title ?? "Page"}
                    </button>
                    <span>/</span>
                  </>
                )}
                <span className="current">
                  {current.icon} {current.title}
                </span>
              </>
            )}
          </nav>
          <div className="topbar-actions">
            <button
              aria-label={
                theme === "dark"
                  ? "Passer au thème papier"
                  : "Passer au thème sombre"
              }
              className="icon-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>
        <div className="document-scroll">
          {pages.error ? (
            <div className="empty-state">
              <p>{pages.error.message}</p>
              <Button onClick={() => void pages.refetch()}>Réessayer</Button>
            </div>
          ) : pageId ? (
            <PageView
              beforeLeave={beforeLeave}
              key={pageId}
              onAction={(a) => {
                if (current) {
                  void action(a, current);
                }
              }}
              onNavigate={(id) => void go(id)}
              onRefresh={refresh}
              pageId={pageId}
              pages={pages.data ?? []}
              user={bootstrap.data.user}
              workspaceId={workspaceId!}
            />
          ) : (
            <main className="home">
              <span className="eyebrow">VOTRE ESPACE, À VOTRE RYTHME</span>
              <h1 className="mt-4">
                Bonjour, {bootstrap.data.user.name.split(" ")[0]}{" "}
                <span className="font-normal">☀</span>
              </h1>
              <p className="muted">
                Un peu de place pour vos prochaines idées.
              </p>
              <section className="home-section">
                <div className="section-label">
                  <Clock3 size={14} />
                  Consultées récemment
                </div>
                <div className="recent-grid">
                  {(recent.data ?? []).slice(0, 6).map((page) => (
                    <button
                      className="recent-card"
                      key={page.id}
                      onClick={() => void go(page.id)}
                    >
                      <span className="card-icon">{page.icon}</span>
                      <strong>{page.title}</strong>
                      <small>
                        {new Date(page.visitedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
              {workspace?.role !== "viewer" && (
                <section className="home-section">
                  <div className="section-label">
                    <Plus size={14} />
                    Créer quelque chose
                  </div>
                  <button
                    className="w-full list-row"
                    onClick={() => void create()}
                  >
                    <FileText size={17} />
                    <span className="row-title text-left">
                      Une page blanche
                    </span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    className="w-full list-row"
                    onClick={() => void create(undefined, "database")}
                  >
                    <Table2 size={17} />
                    <span className="row-title text-left">
                      Une base de données
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </section>
              )}
            </main>
          )}
        </div>
      </SidebarInset>
      <WorkspacePanels
        bootstrap={bootstrap.data}
        onNavigate={(id) => void go(id)}
        onRefresh={refresh}
        workspaceId={workspaceId!}
      />
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPendingMove(null);
          }
        }}
        open={!!pendingMove}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ce déplacement ouvre de nouveaux accès</DialogTitle>
            <DialogDescription>
              Ces membres pourront accéder à la page et aux sous-pages qui
              héritent de ses accès.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto">
            {pendingMove?.audience.map((person) => (
              <div className="settings-row" key={person.id}>
                <span>{person.name}</span>
                <span className="muted">
                  {person.access === "edit" ? "Modification" : "Lecture"}
                </span>
              </div>
            ))}
          </div>
          <Button
            onClick={() =>
              pendingMove && void commitMove(pendingMove, pendingMove.audience)
            }
          >
            Confirmer le déplacement et les accès
          </Button>
          <Button onClick={() => setPendingMove(null)} variant="outline">
            Annuler
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setMoving(null);
          }
        }}
        open={!!moving}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déplacer « {moving?.title} »</DialogTitle>
            <DialogDescription>
              La page héritera des accès de sa destination. Les restrictions
              propres à cette page restent applicables.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-auto">
            <button
              className="w-full list-row"
              onClick={() =>
                moving && void requestMove({ id: moving.id, parentId: null })
              }
            >
              À la racine de l’espace
            </button>
            {pages.data
              ?.filter((p) => p.id !== moving?.id)
              .map((p) => (
                <button
                  className="w-full list-row"
                  key={p.id}
                  onClick={() =>
                    moving &&
                    void requestMove({ id: moving.id, parentId: p.id })
                  }
                >
                  {p.icon} {p.title}
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
