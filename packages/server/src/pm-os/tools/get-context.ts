import { withRun } from "../runs/with-run";
import { workspaceContext } from "../context/workspace-context";
import { sourceFor, rememberSources } from "../../codex/store";
import { pmSnapshot } from "../runs/snapshot";
export async function getPmContext(
  userId: string,
  conversationId: string,
  runId: string,
) {
  return withRun(
    userId,
    conversationId,
    runId,
    async (tx, run, conversation) => {
      const context = await workspaceContext(
        userId,
        conversation.workspaceId,
        conversation.context.pageId,
        run.subjectId,
        tx,
      );
      const subject =
        context.subjects.find((item) => item.id === run.subjectId) ?? null;
      const ids = new Set([
        ...context.references.map((ref) => ref.pageId),
        ...(subject ? [subject.pageId] : []),
      ]);
      const sources = [];
      for (const id of ids)
        sources.push(
          (await sourceFor(tx, userId, conversation.workspaceId, id)).source,
        );
      await rememberSources(tx, conversation, sources);
      const snapshot = await pmSnapshot(conversationId);
      return {
        workspaceId: conversation.workspaceId,
        company: context.settings,
        subject,
        references: context.references,
        artifacts: snapshot.artifacts,
        packVersion: run.packVersion,
        initialized: !!context.settings,
      };
    },
  );
}
