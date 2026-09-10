import { preparePm } from "../../pm-os/runs/prepare-pm";
import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { codexSendSchema } from "@digipm/contracts/codex";
import { selectedText } from "@digipm/editor/document-transform";
import { lockWorkspace, missing } from "../../access";
import { conversationFor, sourceFor, rememberSources, busy } from "../store";
import { runs } from "./shared";

export async function prepareConversation(
  userId: string,
  id: string,
  input: z.infer<typeof codexSendSchema>,
) {
  return await db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    const [exists] = await tx
      .select()
      .from(s.codexConversations)
      .where(eq(s.codexConversations.id, id));
    if (!exists && input.conversationId) throw missing();
    const pm = await preparePm(userId, input, tx, exists);
    if (!exists)
      await tx.insert(s.codexConversations).values({
        id,
        userId,
        workspaceId: input.workspaceId,
        title: input.prompt.slice(0, 80),
        pmPackVersion: pm?.packVersion,
        pmSubjectId: pm?.subjectId,
        continuedFrom: input.continueFrom,
        pmHistory: pm?.history,
      });
    const row = await conversationFor(userId, id, tx);
    if (row.workspaceId !== input.workspaceId) throw missing();
    const messages = await tx
      .select()
      .from(s.codexMessages)
      .where(eq(s.codexMessages.conversationId, id));
    if (messages.some((m) => m.requestId === input.requestId))
      return { reused: true, row };
    if (
      ["running", "awaiting_input"].includes(row.status) ||
      [...runs.values()].some((run) => run.userId === userId)
    )
      throw busy();
    if (messages.length >= 200)
      throw new ORPCError("BAD_REQUEST", {
        message: "Ouvrez une nouvelle conversation pour continuer.",
      });
    if (pm?.sources.length) await rememberSources(tx, row, pm.sources);
    if (pm)
      await tx.insert(s.pmRuns).values({
        id: input.requestId,
        conversationId: id,
        userId,
        workspaceId: input.workspaceId,
        subjectId: pm.subjectId,
        workflowId: pm.workflowId,
        packVersion: pm.packVersion,
      });
    if (input.pageId) {
      const target = await sourceFor(
        tx,
        userId,
        input.workspaceId,
        input.pageId,
      );
      if (input.selection) {
        if (target.document.revision !== input.selection.revision)
          throw new ORPCError("CONFLICT", {
            message:
              "La sélection a changé. Enregistrez puis relancez la demande.",
          });
        selectedText(target.document.content, input.selection);
      }
      await rememberSources(tx, row, [target.source]);
    }
    await tx
      .update(s.codexConversations)
      .set({
        status: "running",
        context: { pageId: input.pageId, selection: input.selection },
        updatedAt: new Date(),
      })
      .where(eq(s.codexConversations.id, id));
    await tx.insert(s.codexMessages).values([
      {
        conversationId: id,
        requestId: input.requestId,
        role: "user",
        text: input.prompt,
        status: "completed",
      },
      {
        conversationId: id,
        requestId: input.requestId,
        role: "assistant",
        status: "running",
      },
    ]);
    return { reused: false, row };
  });
}
