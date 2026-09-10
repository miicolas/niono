import { db, schema as s } from "@digipm/db";
import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { documentText } from "@digipm/contracts";
import { syncDocumentSchema } from "@digipm/contracts/realtime";
import { CollaborativeDocument } from "@digipm/editor/collaboration";
import { accessPage, lockWorkspace, missing } from "../access";
import type { z } from "zod";

export async function syncDocument(
  userId: string,
  raw: z.input<typeof syncDocumentSchema>,
) {
  const input = syncDocumentSchema.parse(raw);
  return db.transaction(async (tx) => {
    const [parent] = await tx
      .select()
      .from(s.pages)
      .where(eq(s.pages.id, input.pageId));
    if (!parent) throw missing();
    await lockWorkspace(tx, parent.workspaceId);
    const { page, canEdit } = await accessPage(tx, userId, input.pageId);
    const [old] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, page.id))
      .for("update");
    if (!old) throw missing();
    const document = new CollaborativeDocument(
      old.collaborationState
        ? Buffer.from(old.collaborationState, "base64")
        : null,
      old.content,
      page.title,
    );
    try {
      const before = Buffer.from(document.snapshot().state).toString("base64");
      if (input.update) document.apply(Buffer.from(input.update, "base64"));
      const next = document.snapshot();
      const state = Buffer.from(next.state).toString("base64");
      const changed = before !== state;
      if (changed && !canEdit) throw new ORPCError("FORBIDDEN");
      const revision = old.revision + (changed ? 1 : 0);
      if (changed) {
        const [last] = await tx
          .select()
          .from(s.versions)
          .where(eq(s.versions.pageId, page.id))
          .orderBy(desc(s.versions.createdAt))
          .limit(1);
        if (!last || Date.now() - last.createdAt.getTime() > 300000)
          await tx.insert(s.versions).values({
            pageId: page.id,
            content: old.content,
            revision: old.revision,
            authorId: userId,
          });
      }
      if (changed || !old.collaborationState)
        await tx
          .update(s.documents)
          .set({
            collaborationState: state,
            content: next.content,
            plainText: documentText(next.content),
            revision,
            updatedAt: changed ? new Date() : old.updatedAt,
          })
          .where(eq(s.documents.pageId, page.id));
      if (changed)
        await tx
          .update(s.pages)
          .set({
            title: next.title,
            revision: page.revision + (next.title !== page.title ? 1 : 0),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(s.pages.id, page.id),
              eq(s.pages.workspaceId, page.workspaceId),
            ),
          );
      return {
        update: Buffer.from(
          document.diff(Buffer.from(input.vector, "base64")),
        ).toString("base64"),
        vector: Buffer.from(document.vector()).toString("base64"),
        revision,
        canEdit,
      };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      throw new ORPCError("BAD_REQUEST", {
        message: "Modification collaborative invalide.",
        cause: error,
      });
    } finally {
      document.destroy();
    }
  });
}
