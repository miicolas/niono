import { type DatabaseTransaction, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { remapViewConfig } from "@/server/services/documents/remap";
import type { Archive } from "@/validators/transfer";
import { assertDatabaseConsistency } from "./assert-database-consistency";
import type { IdMap } from "./id-map";
import { insertChunked } from "./insert-chunked";

/** Insère sources, propriétés, entrées et vues avec leurs nouveaux identifiants. */
export async function insertDatabaseParts(
  tx: DatabaseTransaction,
  archive: Archive,
  ctx: {
    workspaceId: string;
    pageMap: IdMap;
    sourceMap: IdMap;
    propertyMap: IdMap;
  }
) {
  assertDatabaseConsistency(archive);
  if (archive.sources.length) {
    await tx.insert(s.sources).values(
      archive.sources.map((source) => ({
        id: required(ctx.sourceMap.get(source.id)),
        pageId: required(ctx.pageMap.get(source.pageId)),
        workspaceId: ctx.workspaceId,
      }))
    );
  }
  await insertChunked(
    (rows) => tx.insert(s.properties).values(rows),
    archive.properties.map((property) => ({
      ...property,
      id: required(ctx.propertyMap.get(property.id)),
      sourceId: required(ctx.sourceMap.get(property.sourceId)),
    }))
  );
  const base = Date.now();
  await insertChunked(
    (rows) => tx.insert(s.entries).values(rows),
    archive.entries.map((entry, index) => ({
      pageId: required(ctx.pageMap.get(entry.pageId)),
      sourceId: required(ctx.sourceMap.get(entry.sourceId)),
      position: base + index,
    }))
  );
  await insertChunked(
    (rows) => tx.insert(s.views).values(rows),
    archive.views.map((view) => ({
      sourceId: required(ctx.sourceMap.get(view.sourceId)),
      name: view.name,
      config: remapViewConfig(view.config, ctx.propertyMap),
    }))
  );
}
