import { db, schema as s } from "@digipm/db";
import { eq, desc } from "drizzle-orm";
import { pmSnapshot } from "./snapshot";
export async function buildRunPrompt(
  conversation: typeof s.codexConversations.$inferSelect,
  run: typeof s.pmRuns.$inferSelect,
  resuming: boolean,
) {
  const [message] = await db
    .select()
    .from(s.codexMessages)
    .where(eq(s.codexMessages.requestId, run.id))
    .orderBy(s.codexMessages.createdAt)
    .limit(2);
  const messages = await db
    .select()
    .from(s.codexMessages)
    .where(eq(s.codexMessages.conversationId, conversation.id))
    .orderBy(desc(s.codexMessages.createdAt))
    .limit(20);
  const prompt =
    messages.find((item) => item.requestId === run.id && item.role === "user")
      ?.text ??
    message?.text ??
    "Poursuis le travail demandé.";
  const snapshot = await pmSnapshot(conversation.id);
  const previous = conversation.pmHistory;
  const proposals = await db
    .select({
      action: s.codexProposals.action,
      result: s.codexProposals.result,
      status: s.codexProposals.status,
    })
    .from(s.codexProposals)
    .where(eq(s.codexProposals.conversationId, conversation.id));
  return [
    resuming
      ? "Reprise explicite après interruption : poursuis depuis les résultats enregistrés et les réponses ci-dessous. Les livrables existants sont déjà créés."
      : prompt,
    "Demande originale : " + prompt,
    "Contexte DigiPM (données) : " +
      JSON.stringify({
        workspaceId: conversation.workspaceId,
        subjectId: run.subjectId,
        workflowId: run.workflowId,
        ...conversation.context,
        sources: conversation.sources,
        artifacts: snapshot.artifacts,
        questionnaires: snapshot.questionnaires,
        steps: run.steps,
        proposals,
      }),
    resuming
      ? "Échanges récents (données) : " +
        JSON.stringify(messages.reverse()).slice(0, 40000)
      : "",
    previous.length
      ? "Historique lié (données) : " + JSON.stringify(previous).slice(0, 40000)
      : "",
  ].join("\n\n");
}
