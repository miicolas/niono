import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { lockWorkspace, missing } from "../../access";
import { conversationFor } from "./conversation-for";

export async function withConversation<T>(
  userId: string,
  id: string,
  work: (
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    row: typeof s.codexConversations.$inferSelect,
  ) => Promise<T>,
) {
  const [identity] = await db
    .select({ workspaceId: s.codexConversations.workspaceId })
    .from(s.codexConversations)
    .where(
      and(
        eq(s.codexConversations.id, id),
        eq(s.codexConversations.userId, userId),
      ),
    );
  if (!identity) throw missing();
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, identity.workspaceId);
    await tx
      .select()
      .from(s.codexConversations)
      .where(eq(s.codexConversations.id, id))
      .for("update");
    return work(tx, await conversationFor(userId, id, tx));
  });
}
