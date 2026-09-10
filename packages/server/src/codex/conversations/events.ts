import { pmSnapshot } from "../../pm-os/runs/snapshot";
import { activePmRuns } from "../../pm-os/runs/live";
import { createHash } from "node:crypto";
import { db, schema as s } from "@digipm/db";
import { and, eq, asc, sql } from "drizzle-orm";
import { conversationFor } from "../store";
import { runs } from "./shared";

export async function events(
  userId: string,
  conversationId: string,
  after?: string,
) {
  let conversation = await conversationFor(userId, conversationId);
  if (conversation.status === "running" && !runs.has(conversation.id)) {
    const [orphan] = await db
      .update(s.codexConversations)
      .set({ status: "failed", updatedAt: new Date() })
      .where(
        and(
          eq(s.codexConversations.id, conversation.id),
          eq(s.codexConversations.status, "running"),
        ),
      )
      .returning();
    if (orphan)
      await db
        .update(s.codexMessages)
        .set({
          status: "failed",
          error: "Le serveur a redémarré. Relancez la demande.",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(s.codexMessages.conversationId, conversation.id),
            eq(s.codexMessages.status, "running"),
          ),
        );
    if (conversation.pmPackVersion)
      await db
        .update(s.pmRuns)
        .set({ status: "failed", updatedAt: new Date() })
        .where(
          and(
            eq(s.pmRuns.conversationId, conversationId),
            eq(s.pmRuns.status, "running"),
          ),
        );
    conversation = await conversationFor(userId, conversationId);
  }
  const messages = await db
    .select()
    .from(s.codexMessages)
    .where(eq(s.codexMessages.conversationId, conversationId))
    .orderBy(
      asc(s.codexMessages.createdAt),
      sql`CASE WHEN ${s.codexMessages.role}='user' THEN 0 ELSE 1 END`,
    );
  const proposals = await db
    .select()
    .from(s.codexProposals)
    .where(eq(s.codexProposals.conversationId, conversationId))
    .orderBy(asc(s.codexProposals.createdAt));
  const pm = conversation.pmPackVersion
    ? await pmSnapshot(conversationId)
    : null;
  const lastRun = pm?.runs.at(-1);
  const resumable =
    !!lastRun &&
    lastRun.status !== "completed" &&
    !activePmRuns.has(lastRun.id);
  const cursor = [
    pm
      ? createHash("sha256").update(JSON.stringify(pm)).digest("hex") +
        resumable
      : "legacy",
    conversation.updatedAt.getTime(),
    ...messages.map(
      (m) => `${m.id}:${m.updatedAt.getTime()}:${m.text.length}:${m.status}`,
    ),
    ...proposals.map((p) => `${p.id}:${p.status}`),
  ].join("|");
  return {
    conversation: {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      context: conversation.context,
      sources: conversation.sources,
      pmPackVersion: conversation.pmPackVersion,
      pmSubjectId: conversation.pmSubjectId,
      continuedFrom: conversation.continuedFrom,
    },
    pm,
    resumable,
    cursor,
    changed: cursor !== after,
    messages: cursor === after ? null : messages,
    proposals: cursor === after ? null : proposals,
  };
}
