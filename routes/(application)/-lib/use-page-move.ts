import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { PageItem } from "./types";
export type MoveTarget = {
  id: string;
  parentId: string | null;
  beforeId?: string;
};
export type MoveAudience = {
  id: string;
  name: string;
  access: "edit" | "read";
};
export type PendingMove = MoveTarget & { audience: MoveAudience[] };
export function usePageMove({ refresh }: { refresh: () => Promise<void> }) {
  const cache = useQueryClient();
  const [moving, setMoving] = useState<PageItem | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
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
  return {
    moving,
    startMove: (page: PageItem) => setMoving(page),
    cancelMove: () => setMoving(null),
    pendingMove,
    cancelPendingMove: () => setPendingMove(null),
    commitMove,
    requestMove,
  };
}
