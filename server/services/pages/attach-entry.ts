import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";

/** Si le parent est une base, la page devient une entrée de sa source de données. */
export async function attachEntry(
  tx: DatabaseTransaction,
  pageId: string,
  parentId: string
) {
  const [source] = await tx
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, parentId));
  if (source) {
    await tx.insert(s.entries).values({
      sourceId: source.id,
      pageId,
      position: Date.now(),
    });
  }
}
