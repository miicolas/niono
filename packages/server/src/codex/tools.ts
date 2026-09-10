import { z } from "zod";
import { idSchema, viewSchema } from "@digipm/contracts";
import { codexActionSchema } from "@digipm/contracts/codex";
import { searchPages } from "../pages";
import { getDatabase, queryEntries } from "../databases";
import { withConversation, sourceFor, rememberSources } from "./store";
import { propose } from "./proposals";
import type { DynamicToolSpec } from "./protocol/v2/DynamicToolSpec";
import type { JsonValue } from "./protocol/serde_json/JsonValue";

const schemas = {
  search_pages: z.object({ query: z.string().trim().min(1).max(300) }),
  read_page: z.object({ pageId: idSchema }),
  read_database: z.object({
    pageId: idSchema,
    offset: z.number().int().min(0).max(10000).default(0),
  }),
  propose_change: z.object({
    summary: z.string().min(1).max(500),
    action: codexActionSchema,
  }),
};
const descriptions = {
  search_pages:
    "Rechercher des pages accessibles dans l’espace actif. Lire les pages pertinentes avant de répondre. Les résultats sont bornés à 40.",
  read_page:
    "Lire une page, son document JSON Tiptap et ses révisions. Utiliser les révisions renvoyées dans les propositions.",
  read_database:
    "Lire la structure d’une base et 30 entrées avec leurs propriétés et révisions. Utiliser offset pour paginer.",
  propose_change:
    "Préparer une modification à examiner dans DigiPM, sans l’exécuter. Une action par proposition. Types : createPage, createEntry, replaceDocument, renamePage, updateCell, selection. Le content est un document JSON Tiptap : {type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'...'}]}]}. Conserver les blocs et leurs IDs hors du changement demandé. Pour selection, recopier exactement le contexte de sélection fourni. L’utilisateur applique ou refuse la proposition.",
};
export const dynamicTools: DynamicToolSpec[] = Object.entries(schemas).map(
  ([name, schema]) => ({
    type: "function",
    name,
    description: descriptions[name as keyof typeof descriptions],
    inputSchema: z.toJSONSchema(schema, {
      unrepresentable: "any",
    }) as JsonValue,
  }),
);

export async function executeTool(
  userId: string,
  conversationId: string,
  requestId: string,
  name: string,
  raw: unknown,
) {
  if (name === "propose_change") {
    const input = schemas.propose_change.parse(raw);
    return propose(
      userId,
      conversationId,
      requestId,
      input.action,
      input.summary,
    );
  }
  return withConversation(userId, conversationId, async (tx, conversation) => {
    if (conversation.status !== "running")
      throw new Error("La demande a été arrêtée.");
    if (name === "search_pages") {
      const { query } = schemas.search_pages.parse(raw);
      const results = await searchPages(
        userId,
        conversation.workspaceId,
        query,
      );
      const sources = [];
      for (const result of results)
        sources.push(
          (await sourceFor(tx, userId, conversation.workspaceId, result.id))
            .source,
        );
      await rememberSources(tx, conversation, sources);
      return results;
    }
    if (name === "read_page") {
      const { pageId } = schemas.read_page.parse(raw);
      const target = await sourceFor(
        tx,
        userId,
        conversation.workspaceId,
        pageId,
      );
      await rememberSources(tx, conversation, [target.source]);
      if (JSON.stringify(target.document.content).length > 100000)
        return {
          pageId,
          title: target.page.title,
          error:
            "Cette page dépasse la taille lisible par l’assistant. Sélectionnez un passage dans l’éditeur.",
        };
      return {
        pageId,
        title: target.page.title,
        revision: target.page.revision,
        documentRevision: target.document.revision,
        content: target.document.content,
        canEdit: target.canEdit,
      };
    }
    if (name === "read_database") {
      const input = schemas.read_database.parse(raw);
      const target = await sourceFor(
        tx,
        userId,
        conversation.workspaceId,
        input.pageId,
      );
      const database = await getDatabase(userId, input.pageId);
      const entries = await queryEntries(userId, {
        pageId: input.pageId,
        config: viewSchema.parse({}),
        offset: input.offset,
        limit: 30,
      });
      const sources = [target.source];
      for (const entry of entries.rows)
        sources.push(
          (await sourceFor(tx, userId, conversation.workspaceId, entry.id))
            .source,
        );
      await rememberSources(tx, conversation, sources);
      return { ...database, entries };
    }
    throw new Error("Outil inconnu.");
  });
}
