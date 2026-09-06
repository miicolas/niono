import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { env } from "@/env/server";
import { accessPage, missing, withPage } from "./access";
export const assetRoot = () => resolve(env.ASSET_DIR);
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;
export const safeAssetName = (name: string) =>
  name.replace(/[\x00-\x1f/\\]/g, "_").slice(0, 200) || "Fichier";
export function imageMime(bytes: Uint8Array) {
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    Buffer.from(bytes.subarray(0, 6))
      .toString()
      .match(/^GIF8[79]a$/)
  ) {
    return "image/gif";
  }
  if (
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  ) {
    return "image/webp";
  }
  return "application/octet-stream";
}
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
      const [asset] = await tx
        .insert(s.assets)
        .values({
          pageId,
          key,
          name: safeAssetName(name),
          size: bytes.length,
          mime: imageMime(bytes),
        })
        .returning();
      return {
        id: asset!.id,
        name: asset!.name,
        url: `/api/assets/${asset!.id}`,
        mime: asset!.mime,
      };
    });
  } catch (error) {
    await unlink(join(assetRoot(), key)).catch(() => {});
    throw error;
  }
}
export async function readAsset(userId: string, id: string) {
  const [asset] = await db.select().from(s.assets).where(eq(s.assets.id, id));
  if (!asset) {
    throw missing();
  }
  await accessPage(db, userId, asset.pageId);
  return { asset, bytes: await readFile(join(assetRoot(), asset.key)) };
}
