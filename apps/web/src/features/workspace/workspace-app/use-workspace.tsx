import { useWorkspaceRealtime } from "../../realtime/use-workspace-realtime";
import { reportError } from "@/lib/notifications";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useBlocker } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/api";
import { authClient, authResult } from "@/lib/auth-client";
import { useUI } from "@/lib/ui-store";
import type { PageItem } from "../types";
import { type WorkspaceSearch } from "./shared";

export function useWorkspace({ search }: { search: WorkspaceSearch }) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const bootstrap = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => client.bootstrap(),
    retry: false,
  });
  const workspaceId = bootstrap.data?.workspaces.some(
    (workspace) => workspace.id === search.w,
  )
    ? search.w
    : bootstrap.data?.workspaceId;
  const pageId =
    search.w && search.w !== workspaceId ? null : (search.p ?? null);
  const realtimeConnected = useWorkspaceRealtime(
    bootstrap.data?.user.id,
    workspaceId,
    pageId,
  );
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
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: ["pages", workspaceId] });
  };
  const go = async (id: string | null, w = workspaceId) => {
    if (beforeLeave.current && !(await beforeLeave.current())) return;
    if (w && w !== workspaceId) {
      try {
        authResult(
          await authClient.organization.setActive({ organizationId: w }),
        );
      } catch (error) {
        reportError(error);
        return;
      }
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
  return {
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
  };
}
