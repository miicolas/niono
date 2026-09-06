import { ORPCError } from "@orpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s, type Transaction } from "@/db";
export type Connection = typeof db | Transaction;
export const missing = () =>
  new ORPCError("NOT_FOUND", { message: "Page introuvable ou inaccessible." });
export async function workspaceRole(
  cx: Connection,
  userId: string,
  workspaceId: string
) {
  const [member] = await cx
    .select()
    .from(s.members)
    .where(
      and(eq(s.members.workspaceId, workspaceId), eq(s.members.userId, userId))
    );
  if (!member) {
    throw missing();
  }
  return member.role;
}
type Ancestor = {
  id: string;
  created_by: string;
  private_root: boolean;
  deleted_at: Date | null;
  parent_id: string | null;
};
async function ancestry(cx: Connection, pageId: string) {
  const result = await cx.execute<Ancestor>(
    sql`WITH RECURSIVE ancestry AS (SELECT id,parent_id,created_by,private_root,deleted_at,0 AS depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,p.parent_id,p.created_by,p.private_root,p.deleted_at,a.depth+1 FROM pages p JOIN ancestry a ON p.id=a.parent_id WHERE a.depth<30) SELECT * FROM ancestry`
  );
  if (!result.rows.some((row) => row.parent_id === null)) {
    throw missing();
  }
  return result.rows;
}
/** Resolves whether `userId` may see the page; returns null when blocked, else the edit permission. */
function resolveAccess(
  ancestors: Ancestor[],
  grants: { pageId: string; userId: string; role: string }[],
  userId: string,
  role: string
) {
  let canEdit = role !== "viewer";
  for (const ancestor of ancestors) {
    if (!ancestor.private_root || ancestor.created_by === userId) {
      continue;
    }
    const grant = grants.find(
      (g) => g.pageId === ancestor.id && g.userId === userId
    );
    if (!grant) {
      return null;
    }
    if (grant.role === "viewer") {
      canEdit = false;
    }
  }
  return canEdit;
}
function grantsFor(cx: Connection, pageIds: string[], userId?: string) {
  return cx
    .select()
    .from(s.grants)
    .where(
      and(
        inArray(s.grants.pageId, pageIds),
        userId ? eq(s.grants.userId, userId) : undefined
      )
    );
}
export async function accessPage(
  cx: Connection,
  userId: string,
  pageId: string,
  write = false,
  includeDeleted = false
) {
  const [page] = await cx.select().from(s.pages).where(eq(s.pages.id, pageId));
  if (!page) {
    throw missing();
  }
  const role = await workspaceRole(cx, userId, page.workspaceId);
  const ancestors = await ancestry(cx, pageId);
  if (!includeDeleted && ancestors.some((a) => a.deleted_at)) {
    throw missing();
  }
  const privateIds = ancestors.filter((a) => a.private_root).map((a) => a.id);
  const grants = privateIds.length
    ? await grantsFor(cx, privateIds, userId)
    : [];
  const canEdit = resolveAccess(ancestors, grants, userId, role);
  if (canEdit === null) {
    throw missing();
  }
  if (write && !canEdit) {
    throw new ORPCError("FORBIDDEN", {
      message: "Cette page est en lecture seule.",
    });
  }
  return { page, canEdit, role };
}
/** SQL predicate: the page aliased `alias` is visible to `userId` (public, own, or granted). */
export const visibleTo = (userId: string, alias = "p") => {
  const a = sql.raw(alias);
  return sql`(NOT ${a}.private_root OR ${a}.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=${a}.id AND g.user_id=${userId}))`;
};
/** Recursive CTE body `visible(id,parent_id,trashed,depth)` of every page of the workspace reachable by `userId`. */
export const visiblePagesCte = (userId: string, workspaceId: string) =>
  sql`visible AS (
    SELECT p.id,p.parent_id,p.deleted_at IS NOT NULL AS trashed,0 AS depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND ${visibleTo(userId)}
    UNION ALL SELECT p.id,p.parent_id,v.trashed OR p.deleted_at IS NOT NULL,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND ${visibleTo(userId)}
  )`;
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
    access: Awaited<ReturnType<typeof accessPage>>
  ) => Promise<T>,
  includeDeleted = false
) {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(s.pages)
      .where(eq(s.pages.id, pageId));
    if (!page) {
      throw missing();
    }
    await lockWorkspace(tx, page.workspaceId);
    const access = await accessPage(tx, userId, pageId, true, includeDeleted);
    return work(tx, access);
  });
}

function workspaceMembers(cx: Connection, workspaceId: string) {
  return cx
    .select({ id: s.members.userId, name: s.user.name, role: s.members.role })
    .from(s.members)
    .innerJoin(s.user, eq(s.user.id, s.members.userId))
    .where(eq(s.members.workspaceId, workspaceId));
}
type Member = Awaited<ReturnType<typeof workspaceMembers>>[number];
async function audienceOf(
  cx: Connection,
  members: Member[],
  pageId: string | null
) {
  if (!pageId) {
    return members.map((m) => ({ ...m, canEdit: m.role !== "viewer" }));
  }
  const ancestors = await ancestry(cx, pageId);
  const grants = await grantsFor(
    cx,
    ancestors.map((a) => a.id)
  );
  return members.flatMap((member) => {
    const canEdit = resolveAccess(ancestors, grants, member.id, member.role);
    return canEdit === null ? [] : [{ ...member, canEdit }];
  });
}
export async function audienceChange(
  cx: Connection,
  page: typeof s.pages.$inferSelect,
  parentId: string | null
) {
  const members = await workspaceMembers(cx, page.workspaceId);
  const old = await audienceOf(cx, members, page.id);
  let next = await audienceOf(cx, members, parentId);
  if (page.privateRoot) {
    const grants = await cx
      .select()
      .from(s.grants)
      .where(eq(s.grants.pageId, page.id));
    next = next.flatMap((member) => {
      if (member.id === page.createdBy) {
        return [member];
      }
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
