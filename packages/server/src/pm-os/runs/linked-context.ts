import { schema as s, type Transaction } from "@digipm/db";
import { and, eq, desc } from "drizzle-orm";
import { sourceFor } from "../../codex/store/source-for";
import { workspaceRole, missing } from "../../access";
export async function linkedContext(
  userId: string,
  workspaceId: string,
  conversationId: string,
  tx: Transaction,
) {
  await workspaceRole(tx, userId, workspaceId);
  const [previous] = await tx
    .select()
    .from(s.codexConversations)
    .where(
      and(
        eq(s.codexConversations.id, conversationId),
        eq(s.codexConversations.userId, userId),
        eq(s.codexConversations.workspaceId, workspaceId),
      ),
    );
  if (!previous) throw missing();
  const sources = [];
  let missingSource = false;
  for (const source of previous.sources) {
    try {
      sources.push(
        (await sourceFor(tx, userId, workspaceId, source.pageId)).source,
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NOT_FOUND"
      )
        missingSource = true;
      else throw error;
    }
  }
  // A historical answer can quote any source. Omit that history if one source was revoked.
  const history = missingSource
    ? []
    : await tx
        .select({ role: s.codexMessages.role, text: s.codexMessages.text })
        .from(s.codexMessages)
        .where(eq(s.codexMessages.conversationId, conversationId))
        .orderBy(desc(s.codexMessages.createdAt))
        .limit(20);
  let remaining = 40000;
  const bounded = history
    .map((message) => {
      const text = message.text.slice(0, remaining);
      remaining -= text.length;
      return { ...message, text };
    })
    .filter((message) => message.text)
    .reverse();
  return { sources, history: bounded, omittedHistory: missingSource };
}
