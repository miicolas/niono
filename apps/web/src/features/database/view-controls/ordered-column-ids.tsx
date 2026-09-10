import { type ViewConfig } from "@digipm/contracts";
import { type DatabaseProperty } from "./shared";

export function orderedColumnIds(
  properties: DatabaseProperty[],
  config: ViewConfig,
) {
  const ids = ["title", ...properties.map((p) => p.id)];
  const available = new Set(ids);
  return [
    ...new Set([
      ...config.columnOrder.filter((id) => available.has(id)),
      ...ids,
    ]),
  ];
}
