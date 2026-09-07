import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { workspaceRole } from "@/server/services/access/workspace-role";

export async function workspaceMembers(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  return db
    .select({
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      role: s.members.role,
    })
    .from(s.members)
    .innerJoin(s.user, eq(s.user.id, s.members.userId))
    .where(eq(s.members.workspaceId, workspaceId));
}
