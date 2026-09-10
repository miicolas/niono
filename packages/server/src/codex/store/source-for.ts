import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { missing, type Connection } from "../../access";
import { scopedPage } from "./scoped-page";

export async function sourceFor(
  tx: Connection,
  userId: string,
  workspaceId: string,
  pageId: string,
  write = false,
) {
  const access = await scopedPage(userId, workspaceId, pageId, write, tx);
  const [document] = await tx
    .select()
    .from(s.documents)
    .where(eq(s.documents.pageId, pageId));
  if (!document) throw missing();
  return {
    ...access,
    document,
    source: { pageId, title: access.page.title, revision: document.revision },
  };
}
