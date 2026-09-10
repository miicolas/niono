import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { withRun } from "../runs/with-run";
import { sourceFor, rememberSources } from "../../codex/store";
import { documentMarkdown } from "../artifacts/document-markdown";
export async function readPmPage(
  userId: string,
  conversationId: string,
  runId: string,
  pageId: string,
  offset: number,
) {
  return withRun(
    userId,
    conversationId,
    runId,
    async (tx, _run, conversation) => {
      const target = await sourceFor(
        tx,
        userId,
        conversation.workspaceId,
        pageId,
      );
      await rememberSources(tx, conversation, [target.source]);
      const markdown = documentMarkdown(target.document.content);
      const assets = await tx
        .select({
          id: s.assets.id,
          name: s.assets.name,
          size: s.assets.size,
          mime: s.assets.mime,
        })
        .from(s.assets)
        .where(eq(s.assets.pageId, pageId))
        .limit(100);
      return {
        pageId,
        title: target.page.title,
        revision: target.page.revision,
        documentRevision: target.document.revision,
        canEdit: target.canEdit,
        content:
          JSON.stringify(target.document.content).length <= 60000
            ? target.document.content
            : undefined,
        markdown: markdown.slice(offset, offset + 40000),
        nextOffset: offset + 40000 < markdown.length ? offset + 40000 : null,
        assets,
      };
    },
  );
}
