import { schema as s } from "@digipm/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { audienceChange, accessPage, withPage, missing } from "../access";

export async function movePage(
  userId: string,
  input: {
    id: string;
    parentId: string | null;
    beforeId?: string;
    confirmAudienceChange?: boolean;
    confirmedAudience?: { id: string; access: "read" | "edit" }[];
  },
) {
  return withPage(userId, input.id, async (tx, { page }) => {
    if (page.parentId !== input.parentId) {
      const expanded = await audienceChange(tx, page, input.parentId);
      const audienceKey = (audience: { id: string; access: string }[]) =>
        audience
          .map((p) => p.id + ":" + p.access)
          .sort()
          .join("|");
      if (
        expanded.length &&
        (!input.confirmAudienceChange ||
          audienceKey(expanded) !== audienceKey(input.confirmedAudience ?? []))
      )
        throw new ORPCError("PRECONDITION_FAILED", {
          message:
            "Ce déplacement donne de nouveaux accès. Confirmez les destinataires.",
          data: { audience: expanded },
        });
    }
    const [entry] = await tx
      .select()
      .from(s.entries)
      .where(eq(s.entries.pageId, page.id));
    if (entry && input.parentId !== page.parentId)
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Une entrée doit rester dans sa base. Dupliquez son contenu pour créer une page indépendante.",
      });
    if (input.parentId) {
      const target = await accessPage(tx, userId, input.parentId, true);
      if (target.page.workspaceId !== page.workspaceId) throw missing();
      const ancestors = await tx.execute<{ id: string }>(
        sql`WITH RECURSIVE a AS (SELECT id,parent_id FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id FROM pages p JOIN a ON p.id=a.parent_id) SELECT id FROM a`,
      );
      if (ancestors.rows.some((p) => p.id === page.id))
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Une page ne peut pas être placée dans ses propres sous-pages.",
        });
    }
    const descendants = await tx.execute<{ depth: number }>(
      sql`WITH RECURSIVE t AS (SELECT id,0 depth FROM pages WHERE id=${page.id} UNION ALL SELECT p.id,t.depth+1 FROM pages p JOIN t ON p.parent_id=t.id WHERE t.depth<31) SELECT max(depth) depth FROM t`,
    );
    const ancestors = input.parentId
      ? await tx.execute<{ depth: number }>(
          sql`WITH RECURSIVE t AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id,t.depth+1 FROM pages p JOIN t ON p.id=t.parent_id WHERE t.depth<31) SELECT max(depth) depth FROM t`,
        )
      : null;
    if ((ancestors?.rows[0]?.depth ?? 0) + descendants.rows[0]!.depth >= 30)
      throw new ORPCError("BAD_REQUEST", {
        message: "Ce déplacement dépasserait 30 niveaux de pages.",
      });
    if (input.parentId && !entry) {
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, input.parentId));
      if (source)
        await tx.insert(s.entries).values({
          pageId: page.id,
          sourceId: source.id,
          position: Date.now(),
        });
    }
    let position = Date.now();
    if (input.beforeId) {
      const before = await accessPage(tx, userId, input.beforeId);
      if (
        before.page.workspaceId !== page.workspaceId ||
        before.page.parentId !== input.parentId
      )
        throw missing();
      const [previous] = await tx
        .select({ position: s.pages.position })
        .from(s.pages)
        .where(
          and(
            eq(s.pages.workspaceId, page.workspaceId),
            input.parentId
              ? eq(s.pages.parentId, input.parentId)
              : sql`${s.pages.parentId} IS NULL`,
            sql`${s.pages.id} <> ${page.id}`,
            sql`${s.pages.position} < ${before.page.position}`,
          ),
        )
        .orderBy(desc(s.pages.position))
        .limit(1);
      position = previous
        ? (previous.position + before.page.position) / 2
        : before.page.position - 1024;
      if (
        position === before.page.position ||
        position === previous?.position
      ) {
        const siblings = await tx
          .select()
          .from(s.pages)
          .where(
            and(
              eq(s.pages.workspaceId, page.workspaceId),
              input.parentId
                ? eq(s.pages.parentId, input.parentId)
                : sql`${s.pages.parentId} IS NULL`,
              sql`${s.pages.id} <> ${page.id}`,
            ),
          )
          .orderBy(s.pages.position, s.pages.id);
        for (const [index, sibling] of siblings.entries())
          await tx
            .update(s.pages)
            .set({ position: (index + 1) * 1024 })
            .where(eq(s.pages.id, sibling.id));
        position =
          (siblings.findIndex((p) => p.id === input.beforeId) + 1) * 1024 - 512;
      }
    }
    await tx
      .update(s.pages)
      .set({
        parentId: input.parentId,
        position,
        revision: page.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.pages.id, page.id));
    return { ok: true };
  });
}
