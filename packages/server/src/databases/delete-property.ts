import { schema as s } from "@digipm/db";
import { and, eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { viewSchema, withoutProperty } from "@digipm/contracts";
import { withPage, missing } from "../access";

export async function deleteProperty(
  userId: string,
  input: { pageId: string; propertyId: string; expectedName: string },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const [property] = await tx
      .select()
      .from(s.properties)
      .where(
        and(
          eq(s.properties.id, input.propertyId),
          eq(s.properties.sourceId, source.id),
        ),
      );
    if (!property) throw missing();
    if (property.name !== input.expectedName)
      throw new ORPCError("CONFLICT", {
        message: "La propriété a changé. Rechargez la base.",
      });
    const views = await tx
      .select()
      .from(s.views)
      .where(eq(s.views.sourceId, source.id));
    for (const view of views) {
      await tx
        .update(s.views)
        .set({
          config: withoutProperty(viewSchema.parse(view.config), property.id),
          revision: sql`${s.views.revision}+1`,
        })
        .where(eq(s.views.id, view.id));
    }
    await tx.delete(s.properties).where(eq(s.properties.id, property.id));
    return { deleted: true };
  });
}
