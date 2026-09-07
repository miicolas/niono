import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ORPCError } from "@orpc/server";
import { MAX_ASSET_BYTES } from "@/constants/limits";
import { schema as s } from "@/db";
import { ignoreError } from "@/server/lib/ignore-error";
import { required } from "@/server/lib/required";
import { withPage } from "../access/with-page";
import { assetRoot } from "./asset-root";
import { imageMime } from "./image-mime";
import { safeAssetName } from "./safe-asset-name";

/**
 * Écrit un fichier sur le disque puis l'enregistre sur la page, en une seule
 * transaction : si l'insertion échoue, le fichier écrit est supprimé.
 */
export async function storeAsset(
  userId: string,
  pageId: string,
  name: string,
  bytes: Uint8Array
) {
  if (!bytes.length || bytes.length > MAX_ASSET_BYTES) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Choisissez un fichier de 20 Mo maximum.",
    });
  }
  const key = randomUUID();
  await mkdir(assetRoot(), { recursive: true });
  try {
    return await withPage(userId, pageId, async (tx) => {
      await writeFile(join(assetRoot(), key), bytes, {
        flag: "wx",
        mode: 0o600,
      });
      const [inserted] = await tx
        .insert(s.assets)
        .values({
          pageId,
          key,
          name: safeAssetName(name),
          size: bytes.length,
          mime: imageMime(bytes),
        })
        .returning();
      const asset = required(inserted);
      return {
        id: asset.id,
        name: asset.name,
        url: `/api/assets/${asset.id}`,
        mime: asset.mime,
      };
    });
  } catch (error) {
    await unlink(join(assetRoot(), key)).catch(ignoreError);
    throw error;
  }
}
