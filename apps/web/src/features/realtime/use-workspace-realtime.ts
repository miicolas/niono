import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateRealtime } from "./invalidate-realtime";

export function useWorkspaceRealtime(
  userId: string | undefined,
  workspaceId: string | undefined,
  pageId: string | null,
) {
  const cache = useQueryClient();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!userId || !workspaceId) return;
    const params = new URLSearchParams({
      workspaceId,
      ...(pageId ? { pageId } : {}),
    });
    const source = new EventSource(`/api/realtime?${params}`);
    const changes = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setTimeout> | undefined;
    const dispatch = (kind: string, detail: unknown = {}) =>
      window.dispatchEvent(
        new CustomEvent(`digipm:${kind}`, {
          detail: { pageId, ...(detail as object) },
        }),
      );
    const live = () => {
      setConnected(true);
      clearTimeout(heartbeat);
      heartbeat = setTimeout(() => {
        setConnected(false);
        dispatch("offline");
      }, 25000);
    };
    source.addEventListener("ready", () => {
      live();
      void invalidateRealtime(cache, "reconnect");
      dispatch("document");
    });
    source.addEventListener("heartbeat", live);
    source.addEventListener("change", (event) => {
      live();
      changes.add(JSON.parse(event.data).table);
      if (!timer)
        timer = setTimeout(() => {
          timer = undefined;
          for (const table of changes) void invalidateRealtime(cache, table);
          changes.clear();
        }, 80);
    });
    source.addEventListener("document", () => dispatch("document"));
    source.addEventListener("presence", (event) =>
      dispatch("presence", { peers: JSON.parse(event.data) }),
    );
    source.addEventListener("revoked", () => {
      source.close();
      setConnected(false);
      dispatch("revoked");
      // Drop cached content instead of leaving a revoked page visible after a refetch error.
      cache.removeQueries({
        predicate: (query) => query.queryKey[0] !== "bootstrap",
      });
      void cache.invalidateQueries({ queryKey: ["bootstrap"] });
    });
    source.onerror = () => {
      setConnected(false);
      dispatch("offline");
    };
    return () => {
      source.close();
      clearTimeout(timer);
      clearTimeout(heartbeat);
      setConnected(false);
    };
  }, [cache, userId, workspaceId, pageId]);
  return connected;
}
