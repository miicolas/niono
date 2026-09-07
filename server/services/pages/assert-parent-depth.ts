import { ORPCError } from "@orpc/server";
import { sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
import { required } from "@/server/lib/required";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";

const MAX_DEPTH = 30;

/** Vérifie que le parent est modifiable, dans le même espace, et qu'une sous-page y reste sous 30 niveaux. */
export async function assertParentDepth(
  tx: DatabaseTransaction,
  userId: string,
  workspaceId: string,
  parentId: string
) {
  const parent = await accessPage(tx, userId, parentId, true);
  if (parent.page.workspaceId !== workspaceId) {
    throw missing();
  }
  const ancestry = await tx.execute<{ depth: number }>(
    sql`WITH RECURSIVE a AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${parentId} UNION ALL SELECT p.id,p.parent_id,a.depth+1 FROM pages p JOIN a ON p.id=a.parent_id WHERE a.depth<31) SELECT max(depth) depth FROM a`
  );
  if (required(ancestry.rows[0]).depth >= MAX_DEPTH) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Limite de 30 niveaux de pages atteinte.",
    });
  }
}
