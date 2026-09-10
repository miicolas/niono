import { linkedContext } from "./linked-context";
import { schema as s, type Transaction } from "@digipm/db";
import { pmWorkflows } from "@digipm/contracts/pm-os";
import type { z } from "zod";
import type { codexSendSchema } from "@digipm/contracts/codex";
import { ORPCError } from "@orpc/server";
import { readPack } from "../pack/read-pack";
import { workspaceContext } from "../context/workspace-context";
import { conversationFor } from "../../codex/store/conversation-for";
import { missing } from "../../access";
export async function preparePm(
  userId: string,
  input: z.infer<typeof codexSendSchema>,
  tx: Transaction,
  existing?: typeof s.codexConversations.$inferSelect,
) {
  const workflowId =
    input.workflowId ??
    input.prompt.match(/^[/\$]([a-z][a-z0-9-]+)/)?.[1] ??
    null;
  if (workflowId && !pmWorkflows.some((workflow) => workflow.id === workflowId))
    throw new ORPCError("BAD_REQUEST", { message: "Workflow PM-OS inconnu." });
  if (existing && !existing.pmPackVersion) {
    if (workflowId)
      throw new ORPCError("PRECONDITION_FAILED", {
        message:
          "Continuez cette conversation avec PM-OS pour utiliser ses workflows.",
      });
    return null;
  }
  const pack = await readPack(existing?.pmPackVersion);
  if (!pack) {
    if (workflowId)
      throw new ORPCError("PRECONDITION_FAILED", {
        message: "Le pack PM-OS doit être importé par l’administrateur.",
      });
    return null;
  }
  if (
    existing &&
    input.subjectId !== undefined &&
    input.subjectId !== existing.pmSubjectId
  )
    throw new ORPCError("CONFLICT", {
      message: "Ouvrez une nouvelle conversation pour changer de sujet.",
    });
  const context = await workspaceContext(
    userId,
    input.workspaceId,
    input.pageId,
    existing ? existing.pmSubjectId : input.subjectId,
    tx,
  );
  const previous = input.continueFrom
    ? await linkedContext(userId, input.workspaceId, input.continueFrom, tx)
    : null;
  return {
    packVersion: pack.version,
    subjectId: context.selectedSubjectId,
    workflowId,
    sources: previous?.sources ?? [],
    history: previous?.history ?? [],
  };
}
