import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

export function listWorkspaces(userId: string) {
  return db
    .select({
      id: s.workspaces.id,
      name: s.workspaces.name,
      icon: s.workspaces.icon,
      role: s.members.role,
    })
    .from(s.workspaces)
    .innerJoin(
      s.members,
      and(
        eq(s.workspaces.id, s.members.workspaceId),
        eq(s.members.userId, userId)
      )
    );
}
