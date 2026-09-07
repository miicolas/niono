import { and, eq } from "drizzle-orm";
import { schema as s } from "@/db";
import type { Connection } from "./connection";
import { missing } from "./errors";

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
