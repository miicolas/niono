import { eq } from "drizzle-orm";
import { type DatabaseTransaction, db, schema as s } from "@/db";
import { accessPage, type PageAccess } from "./access-page";
import { missing } from "./errors";
import { lockWorkspace } from "./lock-workspace";

/** Exécute `work` dans une transaction, espace verrouillé, après contrôle d'accès en écriture. */
export function withPage<T>(
  userId: string,
  pageId: string,
  work: (tx: DatabaseTransaction, access: PageAccess) => Promise<T>,
  includeDeleted = false
) {
  return db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(s.pages)
      .where(eq(s.pages.id, pageId));
    if (!page) {
      throw missing();
    }
    await lockWorkspace(tx, page.workspaceId);
    const access = await accessPage(tx, userId, pageId, true, includeDeleted);
    return work(tx, access);
  });
}
