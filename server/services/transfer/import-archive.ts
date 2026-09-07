import { createHash } from "node:crypto";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { MAX_ARCHIVE_BYTES } from "@/constants/limits";
import { db, schema as s } from "@/db";
import { ignoreError } from "@/server/lib/ignore-error";
import { required } from "@/server/lib/required";
import { lockWorkspace } from "@/server/services/access/lock-workspace";
import { workspaceRole } from "@/server/services/access/workspace-role";
import { assetRoot } from "@/server/services/assets/asset-root";
import { type Archive, archiveSchema } from "@/validators/transfer";
import { badRequest } from "./import/bad-request";
import { freshIds } from "./import/fresh-ids";
import { insertAssets } from "./import/insert-assets";
import { insertDatabaseParts } from "./import/insert-database-parts";
import { insertPages } from "./import/insert-pages";
import { insertValues } from "./import/insert-values";
import { tooLarge } from "./too-large";

/** Importe une archive dans l'espace ; idempotent par importId, fichiers nettoyés en cas d'échec. */
export async function importArchive(
  userId: string,
  input: { workspaceId: string; importId: string; archive: Archive }
) {
  const archive = archiveSchema.parse(input.archive);
  const serialized = JSON.stringify(archive);
  if (Buffer.byteLength(serialized) > MAX_ARCHIVE_BYTES) {
    throw tooLarge();
  }
  const hash = createHash("sha256").update(serialized).digest("hex");
  const written: string[] = [];
  try {
    return await db.transaction(async (tx) => {
      await lockWorkspace(tx, input.workspaceId);
      if ((await workspaceRole(tx, userId, input.workspaceId)) === "viewer") {
        throw new ORPCError("FORBIDDEN");
      }
      const [job] = await tx
        .select()
        .from(s.importJobs)
        .where(
          and(
            eq(s.importJobs.workspaceId, input.workspaceId),
            eq(s.importJobs.userId, userId),
            eq(s.importJobs.id, input.importId)
          )
        );
      if (job) {
        if (job.hash !== hash) {
          throw badRequest("Ce numéro d’import correspond à un autre fichier.");
        }
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
          .filter((p) => !(p.parentId && pageMap.has(p.parentId)))
          .map((p) => required(pageMap.get(p.id))),
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
      written.map((key) => unlink(join(assetRoot(), key)).catch(ignoreError))
    );
    throw error;
  }
}
