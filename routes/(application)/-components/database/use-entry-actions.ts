import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type { PropertyValue } from "@/validators/databases";
import type { Property, Row } from "./types";
export function useEntryActions({
  pageId,
  onRefresh,
}: {
  pageId: string;
  onRefresh: () => Promise<void>;
}) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    await cache.invalidateQueries({ queryKey: ["entries", pageId] });
    await onRefresh();
  }, [cache, pageId, onRefresh]);
  const updateCell = useCallback(
    async (row: Row, property: Property, value: PropertyValue) => {
      try {
        await orpcClient.databases.updateCell({
          pageId: row.id,
          propertyId: property.id,
          value,
          expectedRevision: row.values[property.id]?.revision ?? 0,
        });
        await refresh();
      } catch (e) {
        reportError(e);
        await cache.invalidateQueries({ queryKey: ["entries", pageId] });
      }
    },
    [cache, pageId, refresh]
  );
  const add = async () => {
    setBusy(true);
    try {
      await orpcClient.databases.addEntry({ pageId, title: "Nouvelle page" });
      await refresh();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };
  return { refresh, updateCell, add, busy };
}
