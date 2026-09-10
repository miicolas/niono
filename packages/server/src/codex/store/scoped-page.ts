import { db } from "@digipm/db";
import { accessPage, missing, type Connection } from "../../access";

export async function scopedPage(
  userId: string,
  workspaceId: string,
  pageId: string,
  write = false,
  cx: Connection = db,
) {
  const result = await accessPage(cx, userId, pageId, write);
  if (result.page.workspaceId !== workspaceId) throw missing();
  return result;
}
