import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { resolve, join } from "node:path";
import { db, schema as s } from "@digipm/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  archiveSchema,
  documentText,
  validatePropertyValue,
  type Archive,
  type DocumentNode,
} from "@digipm/contracts";
import { accessPage, workspaceRole, lockWorkspace, missing } from "./access";
const root = () => resolve(process.env.ASSET_DIR ?? ".data/assets");
const tooLarge = () =>
  new ORPCError("BAD_REQUEST", {
    message:
      "L’archive est limitée à 200 pages et 16 Mo. Exportez un sous-ensemble.",
  });
export async function exportArchive(
  userId: string,
  pageId: string,
  includeAssets: boolean,
): Promise<Archive> {
  return db.transaction(async (tx) => {
    const { page } = await accessPage(tx, userId, pageId);
    await lockWorkspace(tx, page.workspaceId);
    await accessPage(tx, userId, pageId);
    const tree = await tx.execute<{ id: string; depth: number }>(
      sql`WITH RECURSIVE tree AS (SELECT id,0 depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,t.depth+1 FROM pages p JOIN tree t ON p.parent_id=t.id WHERE p.deleted_at IS NULL AND t.depth<30) SELECT * FROM tree ORDER BY depth,id LIMIT 201`,
    );
    if (tree.rows.length > 200) throw tooLarge();
    const archive: Archive = {
      format: "digipm-archive",
      version: 1,
      pages: [],
      sources: [],
      properties: [],
      entries: [],
      values: [],
      views: [],
      assets: [],
      warnings: [],
    };
    let total = 0;
    for (const row of tree.rows) {
      let access;
      try {
        access = await accessPage(tx, userId, row.id);
      } catch {
        archive.warnings.push("Une page inaccessible a été omise.");
        continue;
      }
      const p = access.page;
      const [doc] = await tx
        .select()
        .from(s.documents)
        .where(eq(s.documents.pageId, p.id));
      const exported = {
        id: p.id,
        parentId: p.id === pageId ? null : p.parentId,
        title: p.title,
        icon: p.icon,
        cover: p.cover,
        kind: p.kind,
        privateRoot: p.privateRoot,
        content: doc!.content,
      };
      archive.pages.push(exported);
      total += Buffer.byteLength(JSON.stringify(exported));
      if (total > 16 * 1024 * 1024) throw tooLarge();
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, p.id));
      if (source) {
        archive.sources.push({ id: source.id, pageId: p.id });
        archive.properties.push(
          ...(await tx
            .select()
            .from(s.properties)
            .where(eq(s.properties.sourceId, source.id))),
        );
        archive.views.push(
          ...(await tx
            .select()
            .from(s.views)
            .where(eq(s.views.sourceId, source.id))),
        );
      }
      const [entry] = await tx
        .select()
        .from(s.entries)
        .where(eq(s.entries.pageId, p.id));
      if (entry) {
        archive.entries.push(entry);
        for (const v of await tx
          .select()
          .from(s.values)
          .where(eq(s.values.pageId, p.id)))
          archive.values.push({
            pageId: p.id,
            propertyId: v.propertyId,
            value:
              v.textValue ??
              v.numberValue ??
              v.boolValue ??
              v.arrayValue ??
              null,
          });
      }
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, p.id));
      if (includeAssets)
        for (const asset of assets) {
          total += Math.ceil((asset.size * 4) / 3);
          if (total > 16 * 1024 * 1024) throw tooLarge();
          archive.assets.push({
            id: asset.id,
            pageId: p.id,
            name: asset.name,
            data: (await readFile(join(root(), asset.key))).toString("base64"),
          });
        }
      else if (assets.length)
        archive.warnings.push(
          `Les fichiers de « ${p.title} » ne sont pas inclus.`,
        );
    }
    const sourceIds = new Set(archive.sources.map((s) => s.id));
    archive.entries = archive.entries.filter((e) => sourceIds.has(e.sourceId));
    const entryIds = new Set(archive.entries.map((e) => e.pageId));
    archive.values = archive.values.filter((v) => entryIds.has(v.pageId));
    if (!includeAssets) {
      const fileProperties = new Set(
        archive.properties.filter((p) => p.type === "files").map((p) => p.id),
      );
      archive.values = archive.values.map((cell) =>
        fileProperties.has(cell.propertyId) ? { ...cell, value: [] } : cell,
      );
    }
    return archiveSchema.parse(archive);
  });
}
export async function importArchive(
  userId: string,
  input: { workspaceId: string; importId: string; archive: Archive },
) {
  const archive = archiveSchema.parse(input.archive);
  const serialized = JSON.stringify(archive);
  if (Buffer.byteLength(serialized) > 16 * 1024 * 1024) throw tooLarge();
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
          throw new ORPCError("BAD_REQUEST", {
            message: "Ce numéro d’import correspond à un autre fichier.",
          });
        return job.result;
      }
      const pageMap = new Map(archive.pages.map((p) => [p.id, randomUUID()]));
      const sourceMap = new Map(
        archive.sources.map((s) => [s.id, randomUUID()]),
      );
      const propertyMap = new Map(
        archive.properties.map((p) => [p.id, randomUUID()]),
      );
      const assetMap = new Map(archive.assets.map((a) => [a.id, randomUUID()]));
      if (
        pageMap.size !== archive.pages.length ||
        sourceMap.size !== archive.sources.length ||
        propertyMap.size !== archive.properties.length ||
        assetMap.size !== archive.assets.length
      )
        throw new ORPCError("BAD_REQUEST", {
          message: "Identifiants dupliqués dans l’archive.",
        });
      const archivedPages = new Map(
        archive.pages.map((page) => [page.id, page]),
      );
      for (const page of archive.pages) {
        const path = new Set<string>();
        let current: typeof page | undefined = page;
        while (current) {
          if (path.has(current.id) || path.size >= 30)
            throw new ORPCError("BAD_REQUEST", {
              message: "Arborescence cyclique ou limitée à 30 niveaux.",
            });
          path.add(current.id);
          current = current.parentId
            ? archivedPages.get(current.parentId)
            : undefined;
        }
      }
      const inserted = new Set<string>();
      const warnings = [...archive.warnings];
      const remap = (content: DocumentNode) =>
        JSON.parse(JSON.stringify(content), (key, value) => {
          if (key === "id" && typeof value === "string") return randomUUID();
          if (key === "pageId") return pageMap.get(value) ?? value;
          if (key === "workspaceId") return input.workspaceId;
          if (typeof value === "string" && value.startsWith("/api/assets/"))
            return assetMap.has(value.slice(12))
              ? "/api/assets/" + assetMap.get(value.slice(12))
              : "#fichier-non-inclus";
          return value;
        }) as DocumentNode;
      for (
        let level = 0;
        level < 30 && inserted.size < archive.pages.length;
        level++
      )
        for (const page of archive.pages) {
          if (
            inserted.has(page.id) ||
            (page.parentId &&
              pageMap.has(page.parentId) &&
              !inserted.has(page.parentId))
          )
            continue;
          const cover = page.cover?.startsWith("/api/assets/")
            ? assetMap.has(page.cover.slice(12))
              ? "/api/assets/" + assetMap.get(page.cover.slice(12))
              : null
            : page.cover;
          const content = remap(page.content);
          await tx.insert(s.pages).values({
            id: pageMap.get(page.id)!,
            workspaceId: input.workspaceId,
            parentId: page.parentId
              ? (pageMap.get(page.parentId) ?? null)
              : null,
            title: page.title,
            icon: page.icon,
            cover,
            kind: page.kind,
            privateRoot: page.privateRoot,
            createdBy: userId,
            position: Date.now() + inserted.size,
          });
          await tx.insert(s.documents).values({
            pageId: pageMap.get(page.id)!,
            content,
            plainText: documentText(content),
          });
          inserted.add(page.id);
        }
      if (inserted.size !== archive.pages.length)
        throw new ORPCError("BAD_REQUEST", {
          message: "Arborescence cyclique ou trop profonde.",
        });
      if (
        archive.pages.some(
          (p) =>
            p.kind === "database" &&
            !archive.sources.some((source) => source.pageId === p.id),
        )
      )
        throw new ORPCError("BAD_REQUEST", {
          message: "Une base de l’archive ne contient aucune source.",
        });
      for (const source of archive.sources) {
        if (
          !pageMap.has(source.pageId) ||
          archive.pages.find((p) => p.id === source.pageId)?.kind !== "database"
        )
          throw missing();
        await tx.insert(s.sources).values({
          id: sourceMap.get(source.id)!,
          pageId: pageMap.get(source.pageId)!,
          workspaceId: input.workspaceId,
        });
      }
      for (const property of archive.properties) {
        if (!sourceMap.has(property.sourceId)) throw missing();
        await tx.insert(s.properties).values({
          ...property,
          id: propertyMap.get(property.id)!,
          sourceId: sourceMap.get(property.sourceId)!,
        });
      }
      for (const entry of archive.entries) {
        const source = archive.sources.find((s) => s.id === entry.sourceId);
        if (
          !source ||
          !pageMap.has(entry.pageId) ||
          archive.pages.find((p) => p.id === entry.pageId)?.parentId !==
            source.pageId
        )
          throw missing();
        await tx.insert(s.entries).values({
          pageId: pageMap.get(entry.pageId)!,
          sourceId: sourceMap.get(entry.sourceId)!,
          position: Date.now(),
        });
      }
      for (const view of archive.views) {
        if (!sourceMap.has(view.sourceId)) throw missing();
        const c = view.config;
        await tx.insert(s.views).values({
          sourceId: sourceMap.get(view.sourceId)!,
          name: view.name,
          config: {
            ...c,
            sortBy: propertyMap.get(c.sortBy) ?? c.sortBy,
            groupBy: c.groupBy ? propertyMap.get(c.groupBy) : undefined,
            hidden: c.hidden.map((id) => propertyMap.get(id) ?? id),
            filters: c.filters.map((f) => ({
              ...f,
              propertyId: propertyMap.get(f.propertyId) ?? f.propertyId,
            })),
          },
        });
      }
      await mkdir(root(), { recursive: true });
      for (const asset of archive.assets) {
        if (
          !pageMap.has(asset.pageId) ||
          !/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data)
        )
          throw missing();
        const bytes = Buffer.from(asset.data, "base64");
        const key = randomUUID();
        const { imageMime } = await import("./assets");
        await writeFile(join(root(), key), bytes, { flag: "wx", mode: 0o600 });
        written.push(key);
        await tx.insert(s.assets).values({
          id: assetMap.get(asset.id)!,
          pageId: pageMap.get(asset.pageId)!,
          name: asset.name.replace(/[\x00-\x1f/\\]/g, "_"),
          mime: imageMime(bytes),
          size: bytes.length,
          key,
        });
      }
      for (const cell of archive.values) {
        const property = archive.properties.find(
          (p) => p.id === cell.propertyId,
        );
        const entry = archive.entries.find((e) => e.pageId === cell.pageId);
        if (
          !property ||
          property.sourceId !== entry?.sourceId ||
          !validatePropertyValue(property.type, cell.value, property.options)
        )
          throw missing();
        if (property.type === "person") {
          warnings.push(
            "Les attributions de personnes doivent être réassignées dans le nouvel espace.",
          );
          continue;
        }
        let value = cell.value;
        if (property.type === "files" && Array.isArray(value))
          value = value.map((id) => {
            if (
              !archive.assets.some(
                (a) => a.id === id && a.pageId === cell.pageId,
              )
            )
              throw missing();
            return assetMap.get(id)!;
          });
        await tx.insert(s.values).values({
          pageId: pageMap.get(cell.pageId)!,
          propertyId: propertyMap.get(cell.propertyId)!,
          textValue: typeof value === "string" ? value : null,
          numberValue: typeof value === "number" ? value : null,
          boolValue: typeof value === "boolean" ? value : null,
          arrayValue: Array.isArray(value) ? value : null,
        });
      }
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
      written.map((key) => unlink(join(root(), key)).catch(() => {})),
    );
    throw error;
  }
}
