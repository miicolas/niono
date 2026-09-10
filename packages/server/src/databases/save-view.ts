import { schema as s } from "@digipm/db";
import { and, eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { viewSchema, viewSorts, type ViewConfig } from "@digipm/contracts";
import { withPage, missing } from "../access";
import { validateChart } from "./chart-config";

export async function saveView(
  userId: string,
  input: {
    pageId: string;
    id?: string;
    name: string;
    config: ViewConfig;
    expectedRevision?: number;
  },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const config = viewSchema.parse(input.config);
    const properties = await tx
      .select()
      .from(s.properties)
      .where(eq(s.properties.sourceId, source.id));
    const ids = new Set(["title", ...properties.map((p) => p.id)]);
    if (config.chart || config.layout === "chart")
      validateChart(config, properties);
    const references = [
      ...config.hidden,
      ...config.columnOrder,
      ...Object.keys(config.columnWidths),
      ...config.filters.map((f) => f.propertyId),
      ...viewSorts(config).map((s) => s.propertyId),
      ...(config.groupBy ? [config.groupBy] : []),
    ];
    if (
      references.some((id) => !ids.has(id)) ||
      config.hidden.includes("title")
    )
      throw new ORPCError("BAD_REQUEST", {
        message: "Une propriété de la vue n’existe plus. Rechargez la base.",
      });
    if (input.id) {
      const [updated] = await tx
        .update(s.views)
        .set({ name: input.name, config, revision: sql`${s.views.revision}+1` })
        .where(
          and(
            eq(s.views.id, input.id),
            eq(s.views.sourceId, source.id),
            eq(s.views.revision, input.expectedRevision ?? 0),
          ),
        )
        .returning();
      if (!updated)
        throw new ORPCError("CONFLICT", {
          message: "La vue a changé. Rechargez-la.",
        });
      return updated;
    }
    const [view] = await tx
      .insert(s.views)
      .values({ sourceId: source.id, name: input.name, config })
      .returning();
    return view!;
  });
}
