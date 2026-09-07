import { db } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { audienceChange } from "@/server/services/access/audience";
import { missing } from "@/server/services/access/errors";

/** Audience gagnant un accès si la page était déplacée, sans rien modifier. */
export async function previewMove(
  userId: string,
  id: string,
  parentId: string | null
) {
  const { page } = await accessPage(db, userId, id, true);
  if (parentId) {
    const target = await accessPage(db, userId, parentId, true);
    if (target.page.workspaceId !== page.workspaceId) {
      throw missing();
    }
  }
  return { audience: await audienceChange(db, page, parentId) };
}
