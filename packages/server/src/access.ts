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
    parent_id: string | null;
  }>(
    sql`WITH RECURSIVE ancestry AS (SELECT id,parent_id,created_by,private_root,deleted_at,0 AS depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,p.parent_id,p.created_by,p.private_root,p.deleted_at,a.depth+1 FROM pages p JOIN ancestry a ON p.id=a.parent_id WHERE a.depth<30) SELECT * FROM ancestry`,
  );
  if (!ancestors.rows.some((row) => row.parent_id === null)) throw missing();
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

export async function pageAudience(
  cx: Connection,
  workspaceId: string,
  pageId: string | null,
) {
  const members = await cx
    .select({ id: s.members.userId, name: s.user.name, role: s.members.role })
    .from(s.members)
    .innerJoin(s.user, eq(s.user.id, s.members.userId))
    .where(eq(s.members.workspaceId, workspaceId));
  if (!pageId)
    return members.map((m) => ({ ...m, canEdit: m.role !== "viewer" }));
  const rows = await cx.execute<{
    id: string;
    created_by: string;
    private_root: boolean;
  }>(
    sql`WITH RECURSIVE a AS (SELECT id,parent_id,created_by,private_root,0 depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,p.parent_id,p.created_by,p.private_root,a.depth+1 FROM pages p JOIN a ON p.id=a.parent_id WHERE a.depth<30) SELECT * FROM a`,
  );
  if (!rows.rows.length) throw missing();
  const grants = await cx
    .select()
    .from(s.grants)
    .where(
      sql`${s.grants.pageId} IN (${sql.join(
        rows.rows.map((p) => sql`${p.id}`),
        sql`,`,
      )})`,
    );
  return members.flatMap((member) => {
    let canEdit = member.role !== "viewer";
    for (const page of rows.rows) {
      if (!page.private_root || page.created_by === member.id) continue;
      const grant = grants.find(
        (g) => g.pageId === page.id && g.userId === member.id,
      );
      if (!grant) return [];
      if (grant.role === "viewer") canEdit = false;
    }
    return [{ ...member, canEdit }];
  });
}
export async function audienceChange(
  cx: Connection,
  page: typeof s.pages.$inferSelect,
  parentId: string | null,
) {
  const old = await pageAudience(cx, page.workspaceId, page.id);
  let next = await pageAudience(cx, page.workspaceId, parentId);
  if (page.privateRoot) {
    const grants = await cx
      .select()
      .from(s.grants)
      .where(eq(s.grants.pageId, page.id));
    next = next.flatMap((member) => {
      if (member.id === page.createdBy) return [member];
      const grant = grants.find((g) => g.userId === member.id);
      return grant
        ? [{ ...member, canEdit: member.canEdit && grant.role === "editor" }]
        : [];
    });
  }
  return next
    .filter((member) => {
      const before = old.find((m) => m.id === member.id);
      return !before || (!before.canEdit && member.canEdit);
    })
    .map((member) => ({
      id: member.id,
      name: member.name,
      access: member.canEdit ? ("edit" as const) : ("read" as const),
    }));
}
