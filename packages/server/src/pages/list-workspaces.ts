import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";

export async function listWorkspaces(userId: string) {
  return db
    .select({
      id: s.organization.id,
      name: s.organization.name,
      icon: s.organization.icon,
      role: s.member.role,
    })
    .from(s.organization)
    .innerJoin(
      s.member,
      and(
        eq(s.organization.id, s.member.organizationId),
        eq(s.member.userId, userId),
      ),
    );
}
