import { randomUUID, createHash } from "node:crypto";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { db, schema as s, type Transaction } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  archiveSchema,
  documentText,
  MAX_ARCHIVE_BYTES,
  validatePropertyValue,
  type Archive,
} from "@digipm/contracts";
import { workspaceRole, lockWorkspace, missing } from "../access";
import { assetRoot, imageMime, safeAssetName } from "../assets";
import { valueColumns } from "../property-values";
import { remapAssetUrl, remapDocument, remapViewConfig } from "../remap";
import { tooLarge } from "./too-large";
const CHUNK = 500;
const badRequest = (message: string) =>
  new ORPCError("BAD_REQUEST", { message });
function freshIds<T extends { id: string }>(items: T[]) {
  const map = new Map(items.map((item) => [item.id, randomUUID()]));
  if (map.size !== items.length)
    throw badRequest("Identifiants dupliqués dans l’archive.");
  return map;
}
/** Groups pages by depth (root first); rejects cycles and trees deeper than 30 levels. */
function pageLevels(pages: Archive["pages"]) {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const depths = new Map<string, number>();
  const depthOf = (
    page: Archive["pages"][number],
    path: Set<string>,
  ): number => {
    const known = depths.get(page.id);
    if (known !== undefined) return known;
    if (path.has(page.id))
      throw badRequest("Arborescence cyclique ou limitée à 30 niveaux.");
    path.add(page.id);
    const parent = page.parentId ? byId.get(page.parentId) : undefined;
    const depth = parent ? depthOf(parent, path) + 1 : 0;
    if (depth >= 30)
      throw badRequest("Arborescence cyclique ou limitée à 30 niveaux.");
    depths.set(page.id, depth);
    return depth;
  };
  const levels: Archive["pages"][] = [];
  for (const page of pages) {
    const depth = depthOf(page, new Set());
    (levels[depth] ??= []).push(page);
  }
  return levels;
}
async function insertChunked<T>(
  insert: (rows: T[]) => Promise<unknown>,
  rows: T[],
) {
  for (let at = 0; at < rows.length; at += CHUNK)
    await insert(rows.slice(at, at + CHUNK));
}
export async function importArchive(
  userId: string,
  input: { workspaceId: string; importId: string; archive: Archive },
) {
  const archive = archiveSchema.parse(input.archive);
  const serialized = JSON.stringify(archive);
  if (Buffer.byteLength(serialized) > MAX_ARCHIVE_BYTES) throw tooLarge();
  const hash = createHash("sha256").update(serialized).digest("hex");
  const written: string[] = [];
  try {
    return await db.transaction(async (tx) => {
      await lockWorkspace(tx, input.workspaceId);
      if ((await workspaceRole(tx, userId, input.workspaceId)) === "viewer")
        throw new ORPCError("FORBIDDEN");
      const [job] = await tx
        .select()
        .from(s.importJobs)
        .where(
          and(
            eq(s.importJobs.workspaceId, input.workspaceId),
            eq(s.importJobs.userId, userId),
            eq(s.importJobs.id, input.importId),
          ),
        );
      if (job) {
        if (job.hash !== hash)
          throw badRequest("Ce numéro d’import correspond à un autre fichier.");
        return job.result;
      }
      const pageMap = freshIds(archive.pages);
      const sourceMap = freshIds(archive.sources);
      const propertyMap = freshIds(archive.properties);
      const assetMap = freshIds(archive.assets);
      const warnings = [...archive.warnings];
      await insertPages(tx, archive, {
        userId,
        workspaceId: input.workspaceId,
        pageMap,
        assetMap,
      });
      await insertDatabaseParts(tx, archive, {
        workspaceId: input.workspaceId,
        pageMap,
        sourceMap,
        propertyMap,
      });
      await insertAssets(tx, archive, { pageMap, assetMap, written });
      await insertValues(tx, archive, {
        pageMap,
        propertyMap,
        assetMap,
        warnings,
      });
      const result = {
        pageIds: archive.pages
          .filter((p) => !p.parentId || !pageMap.has(p.parentId))
          .map((p) => pageMap.get(p.id)!),
        warnings: [...new Set(warnings)],
      };
      await tx.insert(s.importJobs).values({
        id: input.importId,
        workspaceId: input.workspaceId,
        userId,
        hash,
        result,
      });
      return result;
    });
  } catch (error) {
    await Promise.all(
      written.map((key) => unlink(join(assetRoot(), key)).catch(() => {})),
    );
    throw error;
  }
}
type IdMap = Map<string, string>;
async function insertPages(
  tx: Transaction,
  archive: Archive,
  ctx: { userId: string; workspaceId: string; pageMap: IdMap; assetMap: IdMap },
) {
  const base = Date.now();
  let index = 0;
  for (const level of pageLevels(archive.pages)) {
    const rows = level.map((page) => ({
      page,
      content: remapDocument(page.content, {
        pages: ctx.pageMap,
        assets: ctx.assetMap,
        workspaceId: ctx.workspaceId,
        missingAsset: "#fichier-non-inclus",
      }),
    }));
    await tx.insert(s.pages).values(
      rows.map(({ page }) => ({
        id: ctx.pageMap.get(page.id)!,
        workspaceId: ctx.workspaceId,
        parentId: page.parentId
          ? (ctx.pageMap.get(page.parentId) ?? null)
          : null,
        title: page.title,
        icon: page.icon,
        cover: page.cover
          ? remapAssetUrl(page.cover, ctx.assetMap, null)
          : null,
        kind: page.kind,
        privateRoot: page.privateRoot,
        createdBy: ctx.userId,
        position: base + index++,
      })),
    );
    await tx.insert(s.documents).values(
      rows.map(({ page, content }) => ({
        pageId: ctx.pageMap.get(page.id)!,
        content,
        plainText: documentText(content),
      })),
    );
  }
}
async function insertDatabaseParts(
  tx: Transaction,
  archive: Archive,
  ctx: {
    workspaceId: string;
    pageMap: IdMap;
    sourceMap: IdMap;
    propertyMap: IdMap;
  },
) {
  const pageById = new Map(archive.pages.map((page) => [page.id, page]));
  const sourceById = new Map(archive.sources.map((src) => [src.id, src]));
  if (
    archive.pages.some(
      (p) =>
        p.kind === "database" &&
        !archive.sources.some((source) => source.pageId === p.id),
    )
  )
    throw badRequest("Une base de l’archive ne contient aucune source.");
  for (const source of archive.sources)
    if (pageById.get(source.pageId)?.kind !== "database") throw missing();
  for (const property of archive.properties)
    if (!sourceById.has(property.sourceId)) throw missing();
  for (const entry of archive.entries) {
    const source = sourceById.get(entry.sourceId);
    if (!source || pageById.get(entry.pageId)?.parentId !== source.pageId)
      throw missing();
  }
  for (const view of archive.views)
    if (!sourceById.has(view.sourceId)) throw missing();
  if (archive.sources.length)
    await tx.insert(s.sources).values(
      archive.sources.map((source) => ({
        id: ctx.sourceMap.get(source.id)!,
        pageId: ctx.pageMap.get(source.pageId)!,
        workspaceId: ctx.workspaceId,
      })),
    );
  await insertChunked(
    (rows) => tx.insert(s.properties).values(rows),
    archive.properties.map((property) => ({
      ...property,
      id: ctx.propertyMap.get(property.id)!,
      sourceId: ctx.sourceMap.get(property.sourceId)!,
    })),
  );
  const base = Date.now();
  await insertChunked(
    (rows) => tx.insert(s.entries).values(rows),
    archive.entries.map((entry, index) => ({
      pageId: ctx.pageMap.get(entry.pageId)!,
      sourceId: ctx.sourceMap.get(entry.sourceId)!,
      position: base + index,
    })),
  );
  await insertChunked(
    (rows) => tx.insert(s.views).values(rows),
    archive.views.map((view) => ({
      sourceId: ctx.sourceMap.get(view.sourceId)!,
      name: view.name,
      config: remapViewConfig(view.config, ctx.propertyMap),
    })),
  );
}
async function insertAssets(
  tx: Transaction,
  archive: Archive,
  ctx: { pageMap: IdMap; assetMap: IdMap; written: string[] },
) {
  if (!archive.assets.length) return;
  await mkdir(assetRoot(), { recursive: true });
  for (const asset of archive.assets) {
    if (
      !ctx.pageMap.has(asset.pageId) ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data)
    )
      throw missing();
    const bytes = Buffer.from(asset.data, "base64");
    const key = randomUUID();
    await writeFile(join(assetRoot(), key), bytes, { flag: "wx", mode: 0o600 });
    ctx.written.push(key);
    await tx.insert(s.assets).values({
      id: ctx.assetMap.get(asset.id)!,
      pageId: ctx.pageMap.get(asset.pageId)!,
      name: safeAssetName(asset.name),
      mime: imageMime(bytes),
      size: bytes.length,
      key,
    });
  }
}
async function insertValues(
  tx: Transaction,
  archive: Archive,
  ctx: {
    pageMap: IdMap;
    propertyMap: IdMap;
    assetMap: IdMap;
    warnings: string[];
  },
) {
  const propertyById = new Map(archive.properties.map((p) => [p.id, p]));
  const entryByPage = new Map(archive.entries.map((e) => [e.pageId, e]));
  const assetsByPage = new Map<string, Set<string>>();
  for (const asset of archive.assets) {
    const owned = assetsByPage.get(asset.pageId) ?? new Set<string>();
    owned.add(asset.id);
    assetsByPage.set(asset.pageId, owned);
  }
  const rows: (typeof s.values.$inferInsert)[] = [];
  for (const cell of archive.values) {
    const property = propertyById.get(cell.propertyId);
    const entry = entryByPage.get(cell.pageId);
    if (
      !property ||
      property.sourceId !== entry?.sourceId ||
      !validatePropertyValue(property.type, cell.value, property.options)
    )
      throw missing();
    if (property.type === "person") {
      ctx.warnings.push(
        "Les attributions de personnes doivent être réassignées dans le nouvel espace.",
      );
      continue;
    }
    let value = cell.value;
    if (property.type === "files" && Array.isArray(value)) {
      const owned = assetsByPage.get(cell.pageId);
      value = value.map((id) => {
        if (!owned?.has(id)) throw missing();
        return ctx.assetMap.get(id)!;
      });
    }
    rows.push({
      pageId: ctx.pageMap.get(cell.pageId)!,
      propertyId: ctx.propertyMap.get(cell.propertyId)!,
      ...valueColumns(value),
    });
  }
  await insertChunked((chunk) => tx.insert(s.values).values(chunk), rows);
}
