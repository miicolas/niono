import type { Asset } from "@/db/schema/assets";

/**
 * Sert un fichier avec une ETag stable : le contenu d'un fichier ne change
 * jamais, le navigateur revalide donc sans retélécharger, tout en repassant
 * par le contrôle d'accès à chaque requête.
 */
export function assetResponse(
  asset: Asset,
  bytes: Buffer,
  ifNoneMatch: string | null
) {
  const etag = `"${asset.id}"`;
  const headers = {
    "Content-Type": asset.mime,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-cache",
    ETag: etag,
    "Content-Disposition": `${asset.mime.startsWith("image/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(new Uint8Array(bytes), {
    headers: { ...headers, "Content-Length": String(bytes.length) },
  });
}
