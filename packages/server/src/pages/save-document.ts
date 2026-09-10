import { replaceCollaboration } from "../realtime/replace-collaboration";
import type { Connection } from "../access";
import { db, schema as s } from "@digipm/db";
import { and, eq, desc } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { createHash } from "node:crypto";
import {
  documentSchema,
  documentText,
  type DocumentNode,
} from "@digipm/contracts";
import { withPage } from "../access";

export async function saveDocument(
  userId: string,
  input: {
    pageId: string;
    expectedRevision: number;
    mutationId: string;
    content: DocumentNode;
  },
  connection: Connection = db,
  forceVersion = false,
) {
  const content = documentSchema.parse(input.content);
  const hash = createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  return withPage(
    userId,
    input.pageId,
    async (tx, { page }) => {
      const [receipt] = await tx
        .select()
        .from(s.receipts)
        .where(
          and(
            eq(s.receipts.pageId, input.pageId),
            eq(s.receipts.mutationId, input.mutationId),
            eq(s.receipts.actorId, userId),
          ),
        );
      if (receipt) {
        if (receipt.hash !== hash)
          throw new ORPCError("BAD_REQUEST", {
            message: "Identifiant de sauvegarde déjà utilisé.",
          });
        return { revision: receipt.revision };
      }
      const [old] = await tx
        .select()
        .from(s.documents)
        .where(eq(s.documents.pageId, input.pageId))
        .for("update");
      if (!old || old.revision !== input.expectedRevision)
        throw new ORPCError("CONFLICT", {
          message:
            "Une autre version a été enregistrée. Votre brouillon est conservé.",
          data: { revision: old?.revision },
        });
      const [last] = await tx
        .select()
        .from(s.versions)
        .where(eq(s.versions.pageId, input.pageId))
        .orderBy(desc(s.versions.createdAt))
        .limit(1);
      if (
        forceVersion ||
        !last ||
        Date.now() - last.createdAt.getTime() > 300000
      )
        await tx.insert(s.versions).values({
          pageId: input.pageId,
          content: old.content,
          revision: old.revision,
          authorId: userId,
        });
      const revision = old.revision + 1;
      await tx
        .update(s.documents)
        .set({
          ...replaceCollaboration(
            old.collaborationState,
            old.content,
            page.title,
            { content },
          ),
          plainText: documentText(content),
          revision,
          updatedAt: new Date(),
        })
        .where(eq(s.documents.pageId, input.pageId));
      await tx
        .update(s.pages)
        .set({ updatedAt: new Date() })
        .where(eq(s.pages.id, input.pageId));
      await tx.insert(s.receipts).values({
        pageId: input.pageId,
        mutationId: input.mutationId,
        actorId: userId,
        hash,
        revision,
      });
      return { revision };
    },
    false,
    connection,
  );
}
