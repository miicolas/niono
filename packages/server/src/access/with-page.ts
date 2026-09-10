import { db, schema as s, type Transaction } from "@digipm/db";
import { eq } from "drizzle-orm";
import { accessPage } from "./access-page";
import { type Connection } from "./shared";
import { missing } from "./missing";
import { lockWorkspace } from "./lock-workspace";

export async function withPage<T>(
  userId: string,
  pageId: string,
  work: (
    tx: Transaction,
    access: Awaited<ReturnType<typeof accessPage>>,
  ) => Promise<T>,
  includeDeleted = false,
  connection: Connection = db,
) {
  return connection.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(s.pages)
      .where(eq(s.pages.id, pageId));
    if (!page) throw missing();
    await lockWorkspace(tx, page.workspaceId);
    const access = await accessPage(tx, userId, pageId, true, includeDeleted);
    return work(tx, access);
  });
}
