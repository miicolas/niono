import { bindContext } from "../../pm-os/context/bind-context";
import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { codexActionSchema } from "@digipm/contracts/codex";
import { transformSelection } from "@digipm/editor/document-transform";
import { createPage, saveDocument, updatePage } from "../../pages";
import { updateCell } from "../../databases";
import { missing } from "../../access";
import { withConversation, sourceFor, scopedPage } from "../store";
import { stale } from "./stale";

export async function decideProposal(
  userId: string,
  input: {
    conversationId: string;
    proposalId: string;
    decision: "apply" | "reject";
    mode?: "replace" | "insert";
  },
) {
  return withConversation(
    userId,
    input.conversationId,
    async (tx, conversation) => {
      const [proposal] = await tx
        .select()
        .from(s.codexProposals)
        .where(
          and(
            eq(s.codexProposals.id, input.proposalId),
            eq(s.codexProposals.conversationId, conversation.id),
            eq(s.codexProposals.userId, userId),
          ),
        )
        .for("update");
      if (!proposal) throw missing();
      if (proposal.status === "applied") {
        if (
          input.decision !== "apply" ||
          (proposal.action.type === "selection" &&
            proposal.result?.mode !== (input.mode ?? "replace"))
        )
          throw stale();
        return proposal;
      }
      if (proposal.status === "rejected") {
        if (input.decision === "reject") return proposal;
        throw stale();
      }
      if (input.decision === "reject") {
        const [result] = await tx
          .update(s.codexProposals)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(eq(s.codexProposals.id, proposal.id))
          .returning();
        return result!;
      }
      const action = codexActionSchema.parse(proposal.action);
      const pageId =
        action.type === "createPage" ? action.parentId : action.pageId;
      if (pageId)
        await scopedPage(userId, conversation.workspaceId, pageId, true, tx);
      let result: {
        pageId: string;
        revision?: number;
        mode?: "replace" | "insert";
      };
      if (action.type === "rememberPage") {
        const target = await sourceFor(
          tx,
          userId,
          conversation.workspaceId,
          action.pageId,
          true,
        );
        if (target.document.revision !== action.expectedRevision) throw stale();
        await bindContext(
          userId,
          {
            workspaceId: conversation.workspaceId,
            subjectId: action.subjectId,
            pageId: action.pageId,
            role: action.role,
          },
          tx,
        );
        result = { pageId: action.pageId, revision: action.expectedRevision };
      } else if (
        action.type === "createPage" ||
        action.type === "createEntry"
      ) {
        if (action.type === "createEntry") {
          const target = await scopedPage(
            userId,
            conversation.workspaceId,
            action.pageId,
            true,
            tx,
          );
          if (target.page.kind !== "database") throw missing();
        }
        const created = await createPage(
          userId,
          {
            workspaceId: conversation.workspaceId,
            parentId:
              action.type === "createPage" ? action.parentId : action.pageId,
            title: action.title,
            content: action.content,
          },
          tx,
        );
        result = { pageId: created.id };
      } else if (action.type === "renamePage") {
        const updated = await updatePage(
          userId,
          {
            id: action.pageId,
            title: action.title,
            expectedRevision: action.expectedRevision,
          },
          tx,
        );
        result = { pageId: action.pageId, revision: updated.revision };
      } else if (action.type === "updateCell") {
        const updated = await updateCell(userId, action, tx);
        result = { pageId: action.pageId, revision: updated.revision };
      } else {
        let content;
        let revision;
        if (action.type === "selection") {
          const target = await sourceFor(
            tx,
            userId,
            conversation.workspaceId,
            action.pageId,
            true,
          );
          if (target.document.revision !== action.selection.revision)
            throw stale();
          content = transformSelection(
            target.document.content,
            action.selection,
            action.text,
            input.mode ?? "replace",
          );
          revision = action.selection.revision;
        } else {
          content = action.content;
          revision = action.expectedRevision;
        }
        const updated = await saveDocument(
          userId,
          {
            pageId: action.pageId,
            content,
            expectedRevision: revision,
            mutationId: proposal.id,
          },
          tx,
          true,
        );
        result = {
          pageId: action.pageId,
          revision: updated.revision,
          ...(action.type === "selection"
            ? { mode: input.mode ?? "replace" }
            : {}),
        };
      }
      const [updated] = await tx
        .update(s.codexProposals)
        .set({ status: "applied", result, updatedAt: new Date() })
        .where(eq(s.codexProposals.id, proposal.id))
        .returning();
      return updated!;
    },
  );
}
