import { ORPCError } from "@orpc/server";
import { db, schema as s } from "@/db";
import type { DocumentNode } from "@/lib/editor/document-node";
import { documentText } from "@/lib/editor/document-text";
import { emptyDocument } from "@/lib/editor/empty-document";
import { required } from "@/server/lib/required";
import { lockWorkspace } from "@/server/services/access/lock-workspace";
import { workspaceRole } from "@/server/services/access/workspace-role";
import { documentSchema } from "@/validators/documents";
import { assertParentDepth } from "./assert-parent-depth";
import { attachEntry } from "./attach-entry";
import { createSource } from "./create-source";

/** Crée une page (ou une base) avec son document ; sous une base, la page devient une entrée. */
export function createPage(
  userId: string,
  input: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string;
    kind?: "page" | "database";
    content?: DocumentNode;
  }
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if ((await workspaceRole(tx, userId, input.workspaceId)) === "viewer") {
      throw new ORPCError("FORBIDDEN");
    }
    if (input.parentId) {
      await assertParentDepth(tx, userId, input.workspaceId, input.parentId);
    }
    const content = documentSchema.parse(input.content ?? emptyDocument);
    const [inserted] = await tx
      .insert(s.pages)
      .values({
        workspaceId: input.workspaceId,
        parentId: input.parentId,
        title: input.title ?? "Sans titre",
        icon: input.icon ?? (input.kind === "database" ? "▦" : "📄"),
        kind: input.kind ?? "page",
        createdBy: userId,
        position: Date.now(),
      })
      .returning();
    const page = required(inserted);
    await tx
      .insert(s.documents)
      .values({ pageId: page.id, content, plainText: documentText(content) });
    if (input.parentId) {
      await attachEntry(tx, page.id, input.parentId);
    }
    if (input.kind === "database") {
      await createSource(tx, page.id, input.workspaceId);
    }
    return page;
  });
}
