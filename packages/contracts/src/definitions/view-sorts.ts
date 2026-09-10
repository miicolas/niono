import { type ViewConfig } from "./view-config";

export function viewSorts(config: ViewConfig): ViewConfig["sorts"] {
  return config.sorts.length
    ? config.sorts
    : config.sortBy === "position"
      ? []
      : [{ propertyId: config.sortBy, direction: config.sortDirection }];
}
