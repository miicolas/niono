import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { type PropertyType, type PropertyOption } from "@digipm/contracts";
import { withPage, missing } from "../access";

export async function addProperty(
  userId: string,
  input: {
    pageId: string;
    name: string;
    type: PropertyType;
    options: PropertyOption[];
  },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const [property] = await tx
      .insert(s.properties)
      .values({
        sourceId: source.id,
        name: input.name,
        type: input.type,
        options: input.options,
        position: Date.now() % 2147483647,
      })
      .returning();
    return property!;
  });
}
