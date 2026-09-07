import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type DatabaseTransaction, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { missing } from "@/server/services/access/errors";
import { assetRoot } from "@/server/services/assets/asset-root";
import { imageMime } from "@/server/services/assets/image-mime";
import { safeAssetName } from "@/server/services/assets/safe-asset-name";
import type { Archive } from "@/validators/transfer";
import type { IdMap } from "./id-map";

const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/** Écrit chaque fichier de l'archive sur disque et l'enregistre ; `written` sert au nettoyage en cas d'échec. */
export async function insertAssets(
  tx: DatabaseTransaction,
  archive: Archive,
  ctx: { pageMap: IdMap; assetMap: IdMap; written: string[] }
) {
  if (!archive.assets.length) {
    return;
  }
  await mkdir(assetRoot(), { recursive: true });
  for (const asset of archive.assets) {
    if (!(ctx.pageMap.has(asset.pageId) && BASE64.test(asset.data))) {
      throw missing();
    }
    const bytes = Buffer.from(asset.data, "base64");
    const key = randomUUID();
    // biome-ignore lint/nursery/noAwaitInLoop: chaque fichier doit être écrit avant d'être enregistré
    await writeFile(join(assetRoot(), key), bytes, { flag: "wx", mode: 0o600 });
    ctx.written.push(key);
    await tx.insert(s.assets).values({
      id: required(ctx.assetMap.get(asset.id)),
      pageId: required(ctx.pageMap.get(asset.pageId)),
      name: safeAssetName(asset.name),
      mime: imageMime(bytes),
      size: bytes.length,
      key,
    });
  }
}
