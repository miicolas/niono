import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { reportError } from "@/lib/ui/notifications";
import { useUI } from "@/lib/ui/store";
import { orpcClient } from "@/orpc/client";
import type { BeforeLeave } from "./use-leave-guard";
import { pagesQuery, recentQuery } from "./workspace-queries";
export function useWorkspaceNavigation({
  workspaceId,
  beforeLeave,
}: {
  workspaceId: string;
  beforeLeave: BeforeLeave;
}) {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const setPanel = useUI((s) => s.setPanel);
  const refresh = async () => {
    await cache.invalidateQueries({
      queryKey: pagesQuery(workspaceId).queryKey,
    });
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
    await cache.invalidateQueries({ queryKey: recentQuery(w).queryKey });
    setPanel("none");
  };
  const create = async (
    parentId?: string,
    kind: "page" | "database" = "page"
  ) => {
    try {
      const page = await orpcClient.pages.create({
        workspaceId,
        parentId,
        kind,
      });
      await refresh();
      await go(page.id);
    } catch (e) {
      reportError(e);
    }
  };
  return { refresh, go, create };
}
