import { and, desc, eq, sql } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import type { Page } from "@/db/schema/pages/types";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";

const GAP = 1024;

/**
 * Position fractionnaire à donner à `page` pour qu'elle précède `beforeId`
 * parmi les enfants de `parentId` ; renumérote la fratrie quand l'espace est épuisé.
 */
export async function siblingPosition(
  tx: DatabaseTransaction,
  userId: string,
  page: Page,
  parentId: string | null,
  beforeId: string
) {
  const before = await accessPage(tx, userId, beforeId);
  if (
    before.page.workspaceId !== page.workspaceId ||
    before.page.parentId !== parentId
  ) {
    throw missing();
  }
  const siblingsOf = and(
    eq(s.pages.workspaceId, page.workspaceId),
    parentId
      ? eq(s.pages.parentId, parentId)
      : sql`${s.pages.parentId} IS NULL`,
    sql`${s.pages.id} <> ${page.id}`
  );
  const [previous] = await tx
    .select({ position: s.pages.position })
    .from(s.pages)
    .where(and(siblingsOf, sql`${s.pages.position} < ${before.page.position}`))
    .orderBy(desc(s.pages.position))
    .limit(1);
  const position = previous
    ? (previous.position + before.page.position) / 2
    : before.page.position - GAP;
  if (position !== before.page.position && position !== previous?.position) {
    return position;
  }
  const siblings = await tx
    .select()
    .from(s.pages)
    .where(siblingsOf)
    .orderBy(s.pages.position, s.pages.id);
  for (const [index, sibling] of siblings.entries()) {
    // biome-ignore lint/nursery/noAwaitInLoop: renumérotation ordonnée dans la transaction
    await tx
      .update(s.pages)
      .set({ position: (index + 1) * GAP })
      .where(eq(s.pages.id, sibling.id));
  }
  return (siblings.findIndex((p) => p.id === beforeId) + 1) * GAP - GAP / 2;
}
