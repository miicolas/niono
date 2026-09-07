import { createHash } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { schema as s } from "@/db";
import type { DocumentNode } from "@/lib/editor/document-node";
import { documentText } from "@/lib/editor/document-text";
import { withPage } from "@/server/services/access/with-page";
import { documentSchema } from "@/validators/documents";

/** Enregistre un document si la révision attendue est courante ; idempotent par mutationId. */
export function saveDocument(
  userId: string,
  input: {
    pageId: string;
    expectedRevision: number;
    mutationId: string;
    content: DocumentNode;
  }
) {
  const content = documentSchema.parse(input.content);
  const hash = createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  return withPage(userId, input.pageId, async (tx) => {
    const [receipt] = await tx
      .select()
      .from(s.receipts)
      .where(
        and(
          eq(s.receipts.pageId, input.pageId),
          eq(s.receipts.mutationId, input.mutationId),
          eq(s.receipts.actorId, userId)
        )
      );
    if (receipt) {
      if (receipt.hash !== hash) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Identifiant de sauvegarde déjà utilisé.",
        });
      }
      return { revision: receipt.revision };
    }
    const [old] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, input.pageId))
      .for("update");
    if (!old || old.revision !== input.expectedRevision) {
      throw new ORPCError("CONFLICT", {
        message:
          "Une autre version a été enregistrée. Votre brouillon est conservé.",
        data: { revision: old?.revision },
      });
    }
    const [last] = await tx
      .select()
      .from(s.versions)
      .where(eq(s.versions.pageId, input.pageId))
      .orderBy(desc(s.versions.createdAt))
      .limit(1);
    if (!last || Date.now() - last.createdAt.getTime() > 300_000) {
      await tx.insert(s.versions).values({
        pageId: input.pageId,
        content: old.content,
        revision: old.revision,
        authorId: userId,
      });
    }
    const revision = old.revision + 1;
    await tx
      .update(s.documents)
      .set({
        content,
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
  });
}
