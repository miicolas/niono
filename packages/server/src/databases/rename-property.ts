import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { withPage, missing } from "../access";

export async function renameProperty(
  userId: string,
  input: {
    pageId: string;
    propertyId: string;
    name: string;
    expectedName: string;
  },
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
        message: "La propriété a été renommée. Rechargez la base.",
      });
    const name = input.name.trim();
    if (!name || name.length > 100) throw new ORPCError("BAD_REQUEST");
    const [updated] = await tx
      .update(s.properties)
      .set({ name })
      .where(eq(s.properties.id, property.id))
      .returning();
    return updated!;
  });
}
