import { useMemo } from "react";
import type { ViewConfig } from "@digipm/contracts";
import { orderedColumnIds } from "../view-controls/ordered-column-ids";
import type { Property } from "./shared";

export function useVisibleProperties(
  properties: Property[],
  config: ViewConfig,
) {
  return useMemo(() => {
    const byId = new Map(properties.map((property) => [property.id, property]));
    const hidden = new Set(config.hidden);
    const columnOrder = orderedColumnIds(properties, config);
    const visible = columnOrder.flatMap((id) => {
      const property = byId.get(id);
      return property && !hidden.has(id) ? [property] : [];
    });
    const visibleOrder = columnOrder.filter(
      (id) => id === "title" || !hidden.has(id),
    );
    return { columnOrder, visible, visibleOrder };
  }, [properties, config.columnOrder, config.hidden]);
}
