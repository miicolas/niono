import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { accessPage } from "../access/access-page";
import { missing } from "../access/errors";
import { assetRoot } from "./asset-root";

/** Relit un fichier après avoir vérifié l'accès à la page qui le porte. */
export async function readAsset(userId: string, id: string) {
  const [asset] = await db.select().from(s.assets).where(eq(s.assets.id, id));
  if (!asset) {
    throw missing();
  }
  await accessPage(db, userId, asset.pageId);
  return { asset, bytes: await readFile(join(assetRoot(), asset.key)) };
}
