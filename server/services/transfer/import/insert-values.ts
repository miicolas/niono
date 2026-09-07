import { type DatabaseTransaction, schema as s } from "@/db";
import { validatePropertyValue } from "@/lib/databases/validate-property-value";
import { required } from "@/server/lib/required";
import { missing } from "@/server/services/access/errors";
import { valueColumns } from "@/server/services/databases/property-values";
import type { Archive } from "@/validators/transfer";
import type { IdMap } from "./id-map";
import { insertChunked } from "./insert-chunked";

const PERSON_WARNING =
  "Les attributions de personnes doivent être réassignées dans le nouvel espace.";

function assetsByPage(archive: Archive) {
  const owned = new Map<string, Set<string>>();
  for (const asset of archive.assets) {
    const set = owned.get(asset.pageId) ?? new Set<string>();
    set.add(asset.id);
    owned.set(asset.pageId, set);
  }
  return owned;
}

/** Insère les valeurs de propriétés validées ; les personnes sont ignorées avec un avertissement. */
export async function insertValues(
  tx: DatabaseTransaction,
  archive: Archive,
  ctx: {
    pageMap: IdMap;
    propertyMap: IdMap;
    assetMap: IdMap;
    warnings: string[];
  }
) {
  const propertyById = new Map(archive.properties.map((p) => [p.id, p]));
  const entryByPage = new Map(archive.entries.map((e) => [e.pageId, e]));
  const owned = assetsByPage(archive);
  const rows: (typeof s.values.$inferInsert)[] = [];
  for (const cell of archive.values) {
    const property = propertyById.get(cell.propertyId);
    const entry = entryByPage.get(cell.pageId);
    if (
      !property ||
      property.sourceId !== entry?.sourceId ||
      !validatePropertyValue(property.type, cell.value, property.options)
    ) {
      throw missing();
    }
    if (property.type === "person") {
      ctx.warnings.push(PERSON_WARNING);
      continue;
    }
    let value = cell.value;
    if (property.type === "files" && Array.isArray(value)) {
      const pageAssets = owned.get(cell.pageId);
      value = value.map((id) => {
        if (!pageAssets?.has(id)) {
          throw missing();
        }
        return required(ctx.assetMap.get(id));
      });
    }
    rows.push({
      pageId: required(ctx.pageMap.get(cell.pageId)),
      propertyId: required(ctx.propertyMap.get(cell.propertyId)),
      ...valueColumns(value),
    });
  }
  await insertChunked((chunk) => tx.insert(s.values).values(chunk), rows);
}
