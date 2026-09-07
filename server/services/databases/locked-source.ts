import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import { missing } from "@/server/services/access/errors";

/** Source de données de la page dans une transaction déjà contrôlée par withPage. */
export async function lockedSource(tx: DatabaseTransaction, pageId: string) {
  const [source] = await tx
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, pageId));
  if (!source) {
    throw missing();
  }
  return source;
}
