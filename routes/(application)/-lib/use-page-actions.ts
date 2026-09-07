import { toast } from "sonner";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import { sortedFavorites } from "./sorted-favorites";
import type { PageItem } from "./types";
import type { BeforeLeave } from "./use-leave-guard";

type Options = {
  workspaceId: string;
  pageId: string | null;
  pages: PageItem[];
  beforeLeave: BeforeLeave;
  go: (id: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  startMove: (page: PageItem) => void;
};
/** Swaps a favorite with the one before it and persists the new order. */
async function moveFavoriteUp(
  workspaceId: string,
  pages: PageItem[],
  page: PageItem
) {
  const favorites = sortedFavorites(pages);
  const at = favorites.findIndex((p) => p.id === page.id);
  const previous = favorites[at - 1];
  const current = favorites[at];
  if (at > 0 && previous && current) {
    favorites[at - 1] = current;
    favorites[at] = previous;
    await orpcClient.pages.reorderFavorites({
      workspaceId,
      ids: favorites.map((p) => p.id),
    });
  }
}
export function usePageActions({
  workspaceId,
  pageId,
  pages,
  beforeLeave,
  go,
  refresh,
  startMove,
}: Options) {
  /** Resolves to false when the open page refuses to be left (unsaved work). */
  const canLeave = async (page: PageItem, requireSaved?: boolean) =>
    !(
      pageId === page.id &&
      beforeLeave.current &&
      !(await beforeLeave.current(requireSaved))
    );
  const duplicate = async (page: PageItem) => {
    if (!(await canLeave(page, true))) {
      return;
    }
    const result = await orpcClient.pages.duplicate({ id: page.id });
    await refresh();
    await go(result.id);
  };
  const trash = async (page: PageItem) => {
    if (!(await canLeave(page))) {
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
    await refresh();
  };
  const handlers: Record<string, (page: PageItem) => Promise<void> | void> = {
    move: startMove,
    "favorite-up": async (page) => {
      await moveFavoriteUp(workspaceId, pages, page);
      await refresh();
    },
    favorite: async (page) => {
      await orpcClient.pages.favorite({ id: page.id, enabled: !page.favorite });
      await refresh();
    },
    duplicate,
    trash,
  };
  return async (action: string, page: PageItem) => {
    try {
      const handler = handlers[action];
      if (handler) {
        await handler(page);
        return;
      }
      await refresh();
    } catch (e) {
      reportError(e);
    }
  };
}
