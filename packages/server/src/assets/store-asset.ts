import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { db, schema as s } from "@digipm/db";
import type { Connection } from "../access";
import { ORPCError } from "@orpc/server";
import { withPage } from "../access";
import { MAX_ASSET_BYTES } from "./shared";
import { assetDirectory as root } from "./asset-directory";
import { imageMime } from "./image-mime";

export async function storeAsset(
  userId: string,
  pageId: string,
  name: string,
  bytes: Uint8Array,
  connection: Connection = db,
) {
  if (!bytes.length || bytes.length > MAX_ASSET_BYTES)
    throw new ORPCError("BAD_REQUEST", {
      message: "Choisissez un fichier de 20 Mo maximum.",
    });
  const key = randomUUID();
  await mkdir(root(), { recursive: true });
  try {
    return await withPage(
      userId,
      pageId,
      async (tx) => {
        await writeFile(join(root(), key), bytes, { flag: "wx", mode: 0o600 });
        const [asset] = await tx
          .insert(s.assets)
          .values({
            pageId,
            key,
            name:
              name.replace(/[\x00-\x1f/\\]/g, "_").slice(0, 200) || "Fichier",
            size: bytes.length,
            mime: imageMime(bytes),
          })
          .returning();
        return {
          id: asset!.id,
          name: asset!.name,
          url: `/api/assets/${asset!.id}`,
          mime: asset!.mime,
          size: asset!.size,
        };
      },
      false,
      connection,
    );
  } catch (error) {
    await unlink(join(root(), key)).catch(() => {});
    throw error;
  }
}
