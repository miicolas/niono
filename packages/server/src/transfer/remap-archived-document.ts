import { randomUUID } from "node:crypto";
import type { DocumentNode } from "@digipm/contracts";
import { remapDocumentMentions } from "@digipm/contracts/definitions/remap-document-mentions";

export function remapArchivedDocument(
  content: DocumentNode,
  pageMap: ReadonlyMap<string, string>,
  assetMap: ReadonlyMap<string, string>,
  workspaceId: string,
): DocumentNode {
  const mapped = JSON.parse(JSON.stringify(content), (key, value) => {
    if (key === "id" && typeof value === "string") return randomUUID();
    if (key === "pageId") return pageMap.get(value) ?? value;
    if (key === "workspaceId") return workspaceId;
    if (typeof value === "string" && value.startsWith("/api/assets/"))
      return assetMap.has(value.slice(12))
        ? "/api/assets/" + assetMap.get(value.slice(12))
        : "#fichier-non-inclus";
    return value;
  }) as DocumentNode;
  return remapDocumentMentions(mapped, pageMap, workspaceId);
}
