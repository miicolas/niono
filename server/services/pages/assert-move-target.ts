import { ORPCError } from "@orpc/server";
import { sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
import type { Page } from "@/db/schema/pages/types";
import { required } from "@/server/lib/required";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";

const MAX_DEPTH = 30;

/** Vérifie que la cible du déplacement est dans le même espace, hors du sous-arbre, et sous 30 niveaux. */
export async function assertMoveTarget(
  tx: DatabaseTransaction,
  userId: string,
  page: Page,
  parentId: string | null
) {
  if (parentId) {
    const target = await accessPage(tx, userId, parentId, true);
    if (target.page.workspaceId !== page.workspaceId) {
      throw missing();
    }
    const ancestors = await tx.execute<{ id: string }>(
      sql`WITH RECURSIVE a AS (SELECT id,parent_id FROM pages WHERE id=${parentId} UNION ALL SELECT p.id,p.parent_id FROM pages p JOIN a ON p.id=a.parent_id) SELECT id FROM a`
    );
    if (ancestors.rows.some((p) => p.id === page.id)) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Une page ne peut pas être placée dans ses propres sous-pages.",
      });
    }
  }
  const descendants = await tx.execute<{ depth: number }>(
    sql`WITH RECURSIVE t AS (SELECT id,0 depth FROM pages WHERE id=${page.id} UNION ALL SELECT p.id,t.depth+1 FROM pages p JOIN t ON p.parent_id=t.id WHERE t.depth<31) SELECT max(depth) depth FROM t`
  );
  const ancestors = parentId
    ? await tx.execute<{ depth: number }>(
        sql`WITH RECURSIVE t AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${parentId} UNION ALL SELECT p.id,p.parent_id,t.depth+1 FROM pages p JOIN t ON p.id=t.parent_id WHERE t.depth<31) SELECT max(depth) depth FROM t`
      )
    : null;
  if (
    (ancestors?.rows[0]?.depth ?? 0) + required(descendants.rows[0]).depth >=
    MAX_DEPTH
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Ce déplacement dépasserait 30 niveaux de pages.",
    });
  }
}
