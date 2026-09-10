import { db, schema as s } from "@digipm/db";
import { and, eq, desc } from "drizzle-orm";
import { workspaceRole } from "../../access";
import { conversationFor } from "../store";

export async function listConversations(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  const candidates = await db
    .select()
    .from(s.codexConversations)
    .where(
      and(
        eq(s.codexConversations.userId, userId),
        eq(s.codexConversations.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(s.codexConversations.updatedAt))
    .limit(100);
  // Even a title can disclose formerly accessible page content.
  const visible = [];
  for (const row of candidates) {
    try {
      await conversationFor(userId, row.id);
      visible.push({ id: row.id, title: row.title, status: row.status });
    } catch {
      visible.push({
        id: row.id,
        title: "Conversation devenue inaccessible",
        status: "failed" as const,
      });
    }
  }
  return visible;
}
