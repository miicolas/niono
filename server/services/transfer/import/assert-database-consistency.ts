import { missing } from "@/server/services/access/errors";
import type { Archive } from "@/validators/transfer";
import { badRequest } from "./bad-request";

/** Chaque base a une source, chaque source/propriété/entrée/vue référence des éléments de l'archive. */
export function assertDatabaseConsistency(archive: Archive) {
  const pageById = new Map(archive.pages.map((page) => [page.id, page]));
  const sourceById = new Map(archive.sources.map((src) => [src.id, src]));
  if (
    archive.pages.some(
      (p) =>
        p.kind === "database" &&
        !archive.sources.some((source) => source.pageId === p.id)
    )
  ) {
    throw badRequest("Une base de l’archive ne contient aucune source.");
  }
  for (const source of archive.sources) {
    if (pageById.get(source.pageId)?.kind !== "database") {
      throw missing();
    }
  }
  for (const property of archive.properties) {
    if (!sourceById.has(property.sourceId)) {
      throw missing();
    }
  }
  for (const entry of archive.entries) {
    const source = sourceById.get(entry.sourceId);
    if (!source || pageById.get(entry.pageId)?.parentId !== source.pageId) {
      throw missing();
    }
  }
  for (const view of archive.views) {
    if (!sourceById.has(view.sourceId)) {
      throw missing();
    }
  }
}
