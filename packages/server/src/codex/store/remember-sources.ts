import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { type Connection } from "../../access";
import type { CodexSource } from "@digipm/contracts/codex";

export async function rememberSources(
  tx: Connection,
  row: typeof s.codexConversations.$inferSelect,
  sources: CodexSource[],
) {
  const byId = new Map(row.sources.map((source) => [source.pageId, source]));
  for (const source of sources) byId.set(source.pageId, source);
  if (byId.size > 200)
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Cette conversation a atteint 200 sources. Ouvrez une nouvelle conversation.",
    });
  await tx
    .update(s.codexConversations)
    .set({ sources: [...byId.values()], updatedAt: new Date() })
    .where(eq(s.codexConversations.id, row.id));
}
