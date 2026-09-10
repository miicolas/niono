import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { canReadWorkspace } from "../permissions";
import { type Connection } from "./shared";
import { missing } from "./missing";

export async function workspaceRole(
  cx: Connection,
  userId: string,
  workspaceId: string,
) {
  const [member] = await cx
    .select()
    .from(s.member)
    .where(
      and(
        eq(s.member.organizationId, workspaceId),
        eq(s.member.userId, userId),
      ),
    );
  if (!member || !canReadWorkspace(member.role)) throw missing();
  return member.role;
}
