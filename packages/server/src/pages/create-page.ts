import { canEditWorkspace } from "../permissions";
import type { Connection } from "../access";
import { db, schema as s } from "@digipm/db";
import { eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  documentSchema,
  documentText,
  emptyDocument,
  viewSchema,
  type DocumentNode,
} from "@digipm/contracts";
import { accessPage, workspaceRole, lockWorkspace, missing } from "../access";

export async function createPage(
  userId: string,
  input: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string;
    kind?: "page" | "database";
    content?: DocumentNode;
  },
  connection: Connection = db,
) {
  return connection.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if (!canEditWorkspace(await workspaceRole(tx, userId, input.workspaceId)))
      throw new ORPCError("FORBIDDEN");
    if (input.parentId) {
      const parent = await accessPage(tx, userId, input.parentId, true);
      if (parent.page.workspaceId !== input.workspaceId) throw missing();
      const ancestry = await tx.execute<{ depth: number }>(
        sql`WITH RECURSIVE a AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id,a.depth+1 FROM pages p JOIN a ON p.id=a.parent_id WHERE a.depth<31) SELECT max(depth) depth FROM a`,
      );
      if (ancestry.rows[0]!.depth >= 30)
        throw new ORPCError("BAD_REQUEST", {
          message: "Limite de 30 niveaux de pages atteinte.",
        });
    }
    const content = documentSchema.parse(input.content ?? emptyDocument);
    const [page] = await tx
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
    await tx
      .insert(s.documents)
      .values({ pageId: page!.id, content, plainText: documentText(content) });
    if (input.parentId) {
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, input.parentId));
      if (source)
        await tx.insert(s.entries).values({
          sourceId: source.id,
          pageId: page!.id,
          position: Date.now(),
        });
    }
    if (input.kind === "database") {
      const [source] = await tx
        .insert(s.sources)
        .values({ pageId: page!.id, workspaceId: input.workspaceId })
        .returning();
      await tx.insert(s.properties).values({
        sourceId: source!.id,
        name: "Statut",
        type: "status",
        options: [
          { id: "todo", name: "À faire", color: "gray" },
          { id: "progress", name: "En cours", color: "blue" },
          { id: "done", name: "Terminé", color: "green" },
        ],
      });
      await tx.insert(s.views).values({
        sourceId: source!.id,
        name: "Table",
        config: viewSchema.parse({ layout: "table" }),
      });
    }
    return page!;
  });
}
