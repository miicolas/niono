import { randomUUID } from "node:crypto";
import type { DocumentNode } from "@/lib/editor/document-node";
import type { ViewConfig } from "@/validators/databases";

const ASSET_PREFIX = "/api/assets/";
type IdMap = ReadonlyMap<string, string>;
export function remapAssetUrl(
  url: string,
  assets: IdMap,
  fallback: string | null
) {
  if (!url.startsWith(ASSET_PREFIX)) {
    return url;
  }
  const id = assets.get(url.slice(ASSET_PREFIX.length));
  return id ? ASSET_PREFIX + id : fallback;
}
export function remapDocument(
  content: DocumentNode,
  maps: {
    pages: IdMap;
    assets: IdMap;
    workspaceId?: string;
    missingAsset?: string;
  }
): DocumentNode {
  return JSON.parse(JSON.stringify(content), (key, value) => {
    if (key === "id" && typeof value === "string") {
      return randomUUID();
    }
    if (key === "pageId") {
      return maps.pages.get(value) ?? value;
    }
    if (key === "workspaceId" && maps.workspaceId) {
      return maps.workspaceId;
    }
    if (typeof value === "string") {
      return remapAssetUrl(value, maps.assets, maps.missingAsset ?? value);
    }
    return value;
  }) as DocumentNode;
}
export function remapViewConfig(
  config: ViewConfig,
  properties: IdMap
): ViewConfig {
  return {
    ...config,
    sortBy: properties.get(config.sortBy) ?? config.sortBy,
    groupBy: config.groupBy ? properties.get(config.groupBy) : undefined,
    hidden: config.hidden.map((id) => properties.get(id) ?? id),
    filters: config.filters.map((f) => ({
      ...f,
      propertyId: properties.get(f.propertyId) ?? f.propertyId,
    })),
  };
}
