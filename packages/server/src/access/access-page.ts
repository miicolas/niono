import { schema as s } from "@digipm/db";
import { and, eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { canEditWorkspace } from "../permissions";
import { type Connection } from "./shared";
import { missing } from "./missing";
import { workspaceRole } from "./workspace-role";

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
  let canEdit = canEditWorkspace(role);
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
