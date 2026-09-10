import { schema as s } from "@digipm/db";
import { eq, sql } from "drizzle-orm";
import { canEditWorkspace, canReadWorkspace } from "../permissions";
import { type Connection } from "./shared";
import { missing } from "./missing";

export async function pageAudience(
  cx: Connection,
  workspaceId: string,
  pageId: string | null,
) {
  const members = await cx
    .select({ id: s.member.userId, name: s.user.name, role: s.member.role })
    .from(s.member)
    .innerJoin(s.user, eq(s.user.id, s.member.userId))
    .where(eq(s.member.organizationId, workspaceId));
  if (!pageId)
    return members
      .filter((m) => canReadWorkspace(m.role))
      .map((m) => ({ ...m, canEdit: canEditWorkspace(m.role) }));
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
    if (!canReadWorkspace(member.role)) return [];
    let canEdit = canEditWorkspace(member.role);
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
