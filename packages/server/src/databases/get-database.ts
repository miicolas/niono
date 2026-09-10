import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { viewSchema } from "@digipm/contracts";
import { sourceFor } from "./source-for";

export async function getDatabase(userId: string, pageId: string) {
  const source = await sourceFor(userId, pageId);
  return {
    source,
    properties: await db
      .select()
      .from(s.properties)
      .where(eq(s.properties.sourceId, source.id))
      .orderBy(s.properties.position),
    views: await db
      .select()
      .from(s.views)
      .where(eq(s.views.sourceId, source.id))
      .then((views) =>
        views.map((view) => ({
          ...view,
          config: viewSchema.parse(view.config),
        })),
      ),
  };
}
