import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { workspaceRole, missing, type Connection } from "../../access";
import { scopedPage } from "./scoped-page";

export async function conversationFor(
  userId: string,
  id: string,
  cx: Connection = db,
) {
  const [row] = await cx
    .select()
    .from(s.codexConversations)
    .where(
      and(
        eq(s.codexConversations.id, id),
        eq(s.codexConversations.userId, userId),
      ),
    );
  if (!row) throw missing();
  await workspaceRole(cx, userId, row.workspaceId);
  for (const source of row.sources)
    await scopedPage(userId, row.workspaceId, source.pageId, false, cx);
  return row;
}
