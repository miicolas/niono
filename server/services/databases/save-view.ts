import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { withPage } from "@/server/services/access/with-page";
import { type ViewConfig, viewSchema } from "@/validators/databases";
import { lockedSource } from "./locked-source";

/** Crée ou met à jour une vue ; la mise à jour exige la révision courante. */
export function saveView(
  userId: string,
  input: {
    pageId: string;
    id?: string;
    name: string;
    config: ViewConfig;
    expectedRevision?: number;
  }
) {
  return withPage(userId, input.pageId, async (tx) => {
    const source = await lockedSource(tx, input.pageId);
    const config = viewSchema.parse(input.config);
    if (input.id) {
      const [updated] = await tx
        .update(s.views)
        .set({ name: input.name, config, revision: sql`${s.views.revision}+1` })
        .where(
          and(
            eq(s.views.id, input.id),
            eq(s.views.sourceId, source.id),
            eq(s.views.revision, input.expectedRevision ?? 0)
          )
        )
        .returning();
      if (!updated) {
        throw new ORPCError("CONFLICT", {
          message: "La vue a changé. Rechargez-la.",
        });
      }
      return updated;
    }
    const [view] = await tx
      .insert(s.views)
      .values({ sourceId: source.id, name: input.name, config })
      .returning();
    return required(view);
  });
}
