import { db, schema as s } from "@digipm/db";
import { and, eq, ilike, asc } from "drizzle-orm";
import { workspaceRole } from "../access";

/** Read-only suggestions over Better Auth's organization memberships. */
export async function searchMentionPeople(
  userId: string,
  workspaceId: string,
  query: string,
) {
  await workspaceRole(db, userId, workspaceId);
  return db
    .select({ id: s.user.id, name: s.user.name })
    .from(s.member)
    .innerJoin(s.user, eq(s.member.userId, s.user.id))
    .where(
      and(
        eq(s.member.organizationId, workspaceId),
        ilike(s.user.name, `%${query.replace(/[%_\\]/g, "\\$&")}%`),
      ),
    )
    .orderBy(asc(s.user.name), asc(s.user.id))
    .limit(10);
}
