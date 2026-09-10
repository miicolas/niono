import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { accessPage, missing } from "../access";
import { assetDirectory as root } from "./asset-directory";

export async function readAsset(userId: string, id: string) {
  const [asset] = await db.select().from(s.assets).where(eq(s.assets.id, id));
  if (!asset) throw missing();
  await accessPage(db, userId, asset.pageId);
  return { asset, bytes: await readFile(join(root(), asset.key)) };
}
