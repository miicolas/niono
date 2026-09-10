import { db } from "@digipm/db";
import { audienceChange, accessPage, missing } from "../access";

export async function previewMove(
  userId: string,
  id: string,
  parentId: string | null,
) {
  const { page } = await accessPage(db, userId, id, true);
  if (parentId) {
    const target = await accessPage(db, userId, parentId, true);
    if (target.page.workspaceId !== page.workspaceId) throw missing();
  }
  return { audience: await audienceChange(db, page, parentId) };
}
