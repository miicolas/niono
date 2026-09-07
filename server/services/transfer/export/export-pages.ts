import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inArray } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { assetRoot } from "@/server/services/assets/asset-root";
import type { Archive } from "@/validators/transfer";
import { createArchiveBudget } from "./archive-budget";

const BASE64_RATIO = 4 / 3;

function groupBy<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const group = map.get(key(row)) ?? [];
    group.push(row);
    map.set(key(row), group);
  }
  return map;
}

/** Ajoute à l'archive les pages, leurs documents et (si demandé) leurs fichiers, sous budget. */
export async function exportPages(
  tx: DatabaseTransaction,
  archive: Archive,
  rootId: string,
  ids: string[],
  includeAssets: boolean
) {
  const pages = await tx.select().from(s.pages).where(inArray(s.pages.id, ids));
  const docs = await tx
    .select()
    .from(s.documents)
    .where(inArray(s.documents.pageId, ids));
  const assets = await tx
    .select()
    .from(s.assets)
    .where(inArray(s.assets.pageId, ids));
  const pageById = new Map(pages.map((page) => [page.id, page]));
  const docByPage = new Map(docs.map((doc) => [doc.pageId, doc]));
  const assetsByPage = groupBy(assets, (asset) => asset.pageId);
  const budget = createArchiveBudget();
  for (const id of ids) {
    const p = required(pageById.get(id));
    const exported = {
      id: p.id,
      parentId: p.id === rootId ? null : p.parentId,
      title: p.title,
      icon: p.icon,
      cover: p.cover,
      kind: p.kind,
      privateRoot: p.privateRoot,
      content: required(docByPage.get(id)).content,
    };
    archive.pages.push(exported);
    budget(Buffer.byteLength(JSON.stringify(exported)));
    const pageAssets = assetsByPage.get(id) ?? [];
    if (!includeAssets) {
      if (pageAssets.length) {
        archive.warnings.push(
          `Les fichiers de « ${p.title} » ne sont pas inclus.`
        );
      }
      continue;
    }
    for (const asset of pageAssets) {
      budget(Math.ceil(asset.size * BASE64_RATIO));
      // biome-ignore lint/nursery/noAwaitInLoop: le budget doit être vérifié avant chaque lecture
      const bytes = await readFile(join(assetRoot(), asset.key));
      archive.assets.push({
        id: asset.id,
        pageId: p.id,
        name: asset.name,
        data: bytes.toString("base64"),
      });
    }
  }
}
