import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { documentText, validatePropertyValue } from "@digipm/contracts";
import { codexActionSchema } from "@digipm/contracts/codex";
import {
  canonicalDocument,
  selectedText,
} from "@digipm/editor/document-transform";
import { workspaceRole, missing } from "../../access";
import { canEditWorkspace } from "../../permissions";
import { withConversation, sourceFor, rememberSources } from "../store";
import { stale } from "./stale";

export async function propose(
  userId: string,
  conversationId: string,
  requestId: string,
  raw: unknown,
  summary: string,
) {
  let action = codexActionSchema.parse(raw);
  return withConversation(userId, conversationId, async (tx, row) => {
    if (row.status !== "running")
      throw new ORPCError("CONFLICT", { message: "La demande a été arrêtée." });
    if (!canEditWorkspace(await workspaceRole(tx, userId, row.workspaceId)))
      throw new ORPCError("FORBIDDEN", {
        message: "Votre accès est en lecture seule.",
      });
    const count = await tx
      .select({ id: s.codexProposals.id })
      .from(s.codexProposals)
      .where(
        and(
          eq(s.codexProposals.conversationId, row.id),
          eq(s.codexProposals.requestId, requestId),
        ),
      );
    if (count.length >= 20)
      throw new Error("Maximum de 20 propositions par demande.");
    let before = "Nouvelle page";
    const pageId =
      action.type === "createPage" ? action.parentId : action.pageId;
    if (pageId) {
      const target = await sourceFor(tx, userId, row.workspaceId, pageId, true);
      await rememberSources(tx, row, [target.source]);
      before = target.page.title;
      if (action.type === "rememberPage") {
        if (
          target.document.revision !== action.expectedRevision ||
          (action.subjectId !== null && action.subjectId !== row.pmSubjectId)
        )
          throw stale();
        before = documentText(target.document.content);
      } else if (action.type === "replaceDocument") {
        if (target.document.revision !== action.expectedRevision) throw stale();
        before = documentText(target.document.content);
      } else if (
        action.type === "renamePage" &&
        target.page.revision !== action.expectedRevision
      )
        throw stale();
      else if (action.type === "selection") {
        if (
          row.context.pageId !== pageId ||
          row.context.selection?.from !== action.selection.from ||
          row.context.selection?.to !== action.selection.to ||
          row.context.selection?.text !== action.selection.text ||
          row.context.selection?.revision !== action.selection.revision ||
          target.document.revision !== action.selection.revision
        )
          throw stale();
        selectedText(target.document.content, action.selection);
        before = action.selection.text;
      } else if (action.type === "updateCell") {
        const [entry] = await tx
          .select()
          .from(s.entries)
          .where(eq(s.entries.pageId, pageId));
        if (!entry) throw missing();
        const [property] = await tx
          .select()
          .from(s.properties)
          .where(
            and(
              eq(s.properties.id, action.propertyId),
              eq(s.properties.sourceId, entry.sourceId),
            ),
          );
        if (
          !property ||
          !validatePropertyValue(property.type, action.value, property.options)
        )
          throw new ORPCError("BAD_REQUEST", {
            message: "Propriété ou valeur invalide.",
          });
        const [old] = await tx
          .select()
          .from(s.values)
          .where(
            and(
              eq(s.values.pageId, pageId),
              eq(s.values.propertyId, action.propertyId),
            ),
          );
        if ((old?.revision ?? 0) !== action.expectedRevision) throw stale();
        before = `${target.page.title} · ${property.name} : ${JSON.stringify(old?.textValue ?? old?.numberValue ?? old?.boolValue ?? old?.arrayValue ?? null)}`;
      } else if (
        action.type === "createEntry" &&
        target.page.kind !== "database"
      )
        throw missing();
    }
    if ("content" in action)
      action = { ...action, content: canonicalDocument(action.content) };
    const [proposal] = await tx
      .insert(s.codexProposals)
      .values({
        conversationId,
        userId,
        workspaceId: row.workspaceId,
        requestId,
        action,
        before,
        summary: z.string().trim().min(1).max(500).parse(summary),
      })
      .returning();
    return {
      proposalId: proposal!.id,
      status: "pending",
      message:
        "Proposition enregistrée. L’utilisateur doit l’appliquer dans DigiPM ; aucune modification n’a encore été effectuée.",
    };
  });
}
