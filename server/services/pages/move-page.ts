import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { withPage } from "@/server/services/access/with-page";
import { assertAudienceConfirmed } from "./assert-audience-confirmed";
import { assertMoveTarget } from "./assert-move-target";
import { siblingPosition } from "./sibling-position";

/** Déplace une page (nouveau parent et/ou nouvelle position) après contrôle des accès, des cycles et de la profondeur. */
export function movePage(
  userId: string,
  input: {
    id: string;
    parentId: string | null;
    beforeId?: string;
    confirmAudienceChange?: boolean;
    confirmedAudience?: { id: string; access: "read" | "edit" }[];
  }
) {
  return withPage(userId, input.id, async (tx, { page }) => {
    await assertAudienceConfirmed(tx, page, input);
    const [entry] = await tx
      .select()
      .from(s.entries)
      .where(eq(s.entries.pageId, page.id));
    if (entry && input.parentId !== page.parentId) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Une entrée doit rester dans sa base. Dupliquez son contenu pour créer une page indépendante.",
      });
    }
    await assertMoveTarget(tx, userId, page, input.parentId);
    if (input.parentId && !entry) {
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, input.parentId));
      if (source) {
        await tx.insert(s.entries).values({
          pageId: page.id,
          sourceId: source.id,
          position: Date.now(),
        });
      }
    }
    const position = input.beforeId
      ? await siblingPosition(tx, userId, page, input.parentId, input.beforeId)
      : Date.now();
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
