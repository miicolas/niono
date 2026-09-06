import { db, schema as s, type Transaction } from "@digipm/db";
import { and, eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
export type Connection = typeof db | Transaction;
export const missing = () =>
  new ORPCError("NOT_FOUND", { message: "Page introuvable ou inaccessible." });
export async function workspaceRole(
  cx: Connection,
  userId: string,
  workspaceId: string,
) {
  const [member] = await cx
    .select()
    .from(s.members)
    .where(
      and(eq(s.members.workspaceId, workspaceId), eq(s.members.userId, userId)),
    );
  if (!member) throw missing();
  return member.role;
}
export async function accessPage(
  cx: Connection,
  userId: string,
  pageId: string,
  write = false,
  includeDeleted = false,
) {
  const [page] = await cx.select().from(s.pages).where(eq(s.pages.id, pageId));
  if (!page) throw missing();
  const role = await workspaceRole(cx, userId, page.workspaceId);
  const ancestors = await cx.execute<{
    id: string;
    created_by: string;
    private_root: boolean;
    deleted_at: Date | null;
  }>(
    sql`WITH RECURSIVE ancestry AS (SELECT id,parent_id,created_by,private_root,deleted_at,0 AS depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,p.parent_id,p.created_by,p.private_root,p.deleted_at,a.depth+1 FROM pages p JOIN ancestry a ON p.id=a.parent_id WHERE a.depth<30) SELECT * FROM ancestry`,
  );
  let canEdit = role !== "viewer";
  for (const ancestor of ancestors.rows) {
    if (ancestor.deleted_at && !includeDeleted) throw missing();
    if (ancestor.private_root && ancestor.created_by !== userId) {
      const [grant] = await cx
        .select()
        .from(s.grants)
        .where(
          and(eq(s.grants.pageId, ancestor.id), eq(s.grants.userId, userId)),
        );
      if (!grant) throw missing();
      if (grant.role === "viewer") canEdit = false;
    }
  }
  if (write && !canEdit)
    throw new ORPCError("FORBIDDEN", {
      message: "Cette page est en lecture seule.",
    });
  return { page, canEdit, role };
}
export async function lockWorkspace(cx: Transaction, workspaceId: string) {
  await cx
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(eq(s.workspaces.id, workspaceId))
    .for("update");
}
export async function withPage<T>(
  userId: string,
  pageId: string,
  work: (
    tx: Transaction,
    access: Awaited<ReturnType<typeof accessPage>>,
  ) => Promise<T>,
  includeDeleted = false,
) {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(s.pages)
      .where(eq(s.pages.id, pageId));
    if (!page) throw missing();
    await lockWorkspace(tx, page.workspaceId);
    const access = await accessPage(tx, userId, pageId, true, includeDeleted);
    return work(tx, access);
  });
}
