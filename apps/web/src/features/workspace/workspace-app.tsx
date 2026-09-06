import { reportError } from "@/lib/notifications";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock3,
  Plus,
  FileText,
  Table2,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { client } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useUI } from "@/lib/ui-store";
import type { PageItem } from "./types";
import { PageView } from "./page-view";
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
    queryFn: () => client.bootstrap(),
    retry: false,
  });
  const workspaceId = search.w ?? bootstrap.data?.workspaceId;
  const pageId = search.p ?? null;
  const pages = useQuery({
    queryKey: ["pages", workspaceId],
    queryFn: () => client.pages.list({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
  });
  const recent = useQuery({
    queryKey: ["recent", workspaceId],
    queryFn: () => client.pages.recent({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
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
      )
        return false;
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
    )
      void navigate({ to: "/login" });
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
    if (beforeLeave.current && !(await beforeLeave.current())) return;
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
    kind: "page" | "database" = "page",
  ) => {
    try {
      const page = await client.pages.create({
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
  const move = async (
    id: string,
    parentId: string | null,
    beforeId?: string,
    confirmed = false,
    confirmedAudience?: { id: string; access: "edit" | "read" }[],
  ) => {
    try {
      if (!confirmed) {
        const preview = await client.pages.previewMove({ id, parentId });
        if (preview.audience.length) {
          setPendingMove({
            id,
            parentId,
            beforeId,
            audience: preview.audience,
          });
          return;
        }
      }
      await client.pages.move({
        id,
        parentId,
        beforeId,
        confirmAudienceChange: confirmed,
        confirmedAudience,
      });
      setPendingMove(null);
      await cache.invalidateQueries({ queryKey: ["page", id] });
      await refresh();
      setMoving(null);
    } catch (e) {
      reportError(e);
    }
  };
  const action = async (action: string, page: PageItem) => {
    try {
      if (action === "move") {
        setMoving(page);
        return;
      }
      if (action === "favorite-up") {
        const favorites = (pages.data ?? [])
          .filter((p) => p.favorite)
          .sort(
            (a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0),
          );
        const at = favorites.findIndex((p) => p.id === page.id);
        if (at > 0) {
          [favorites[at - 1], favorites[at]] = [
            favorites[at]!,
            favorites[at - 1]!,
          ];
          await client.pages.reorderFavorites({
            workspaceId: workspaceId!,
            ids: favorites.map((p) => p.id),
          });
        }
        await refresh();
        return;
      }
      if (action === "favorite")
        await client.pages.favorite({ id: page.id, enabled: !page.favorite });
      if (action === "duplicate") {
        if (
          pageId === page.id &&
          beforeLeave.current &&
          !(await beforeLeave.current(true))
        )
          return;
        const result = await client.pages.duplicate({ id: page.id });
        await refresh();
        await go(result.id);
        return;
      }
      if (action === "trash") {
        if (
          pageId === page.id &&
          beforeLeave.current &&
          !(await beforeLeave.current())
        )
          return;
        await client.pages.trash({ id: page.id });
        if (pageId === page.id) await go(null);
        toast("Page placée dans la corbeille", {
          action: {
            label: "Annuler",
            onClick: async () => {
              await client.pages.trash({ id: page.id, restore: true });
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
  if (bootstrap.isPending)
    return (
      <div className="empty-state">
        <span className="brand-mark">D</span>
        <p>Ouverture de votre espace…</p>
      </div>
    );
  if (!bootstrap.data)
    return (
      <div className="empty-state">
        <h1>Votre espace est indisponible</h1>
        <p>{bootstrap.error?.message}</p>
        <Button onClick={() => void bootstrap.refetch()}>Réessayer</Button>
      </div>
    );
  const current = pages.data?.find((p) => p.id === pageId);
  const workspace = bootstrap.data.workspaces.find((w) => w.id === workspaceId);
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "250px" } as React.CSSProperties}
    >
      <AppSidebar
        pages={pages.data ?? []}
        currentId={pageId}
        workspaceId={workspaceId!}
        bootstrap={bootstrap.data}
        onNavigate={(id) => void go(id)}
        onCreate={(parent, kind) => void create(parent, kind)}
        onWorkspace={(id) => void go(null, id)}
        onNewWorkspace={async (name) => {
          try {
            const w = await client.workspace.create({ name });
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
        <header className="topbar">
          <SidebarTrigger />
          <nav className="breadcrumbs" aria-label="Fil d’Ariane">
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
              className="icon-button"
              aria-label={
                theme === "dark"
                  ? "Passer au thème papier"
                  : "Passer au thème sombre"
              }
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
              key={pageId}
              pageId={pageId}
              workspaceId={workspaceId!}
              user={bootstrap.data.user}
              pages={pages.data ?? []}
              onRefresh={refresh}
              onNavigate={(id) => void go(id)}
              beforeLeave={beforeLeave}
              onAction={(a) => {
                if (current) void action(a, current);
              }}
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
                    className="list-row w-full"
                    onClick={() => void create()}
                  >
                    <FileText size={17} />
                    <span className="row-title text-left">
                      Une page blanche
                    </span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    className="list-row w-full"
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
        workspaceId={workspaceId!}
        bootstrap={bootstrap.data}
        onNavigate={(id) => void go(id)}
        onRefresh={refresh}
      />
      <Dialog
        open={!!pendingMove}
        onOpenChange={(v) => {
          if (!v) setPendingMove(null);
        }}
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
              pendingMove &&
              void move(
                pendingMove.id,
                pendingMove.parentId,
                pendingMove.beforeId,
                true,
                pendingMove.audience,
              )
            }
          >
            Confirmer le déplacement et les accès
          </Button>
          <Button variant="outline" onClick={() => setPendingMove(null)}>
            Annuler
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!moving}
        onOpenChange={(v) => {
          if (!v) setMoving(null);
        }}
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
              className="list-row w-full"
              onClick={() => moving && void move(moving.id, null)}
            >
              À la racine de l’espace
            </button>
            {pages.data
              ?.filter((p) => p.id !== moving?.id)
              .map((p) => (
                <button
                  className="list-row w-full"
                  key={p.id}
                  onClick={() => moving && void move(moving.id, p.id)}
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
