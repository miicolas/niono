import type { JSONContent } from "@tiptap/react";
import { isImageMime } from "@/constants/image-types";
import type { UploadedAsset } from "@/features/editor/upload";

/**
 * Bloc à insérer pour un fichier envoyé : une image si le serveur a reconnu un
 * format d'image dans les octets reçus, une pièce jointe sinon.
 */
export function assetNode(asset: UploadedAsset): JSONContent {
  if (isImageMime(asset.mime)) {
    return { type: "image", attrs: { src: asset.url, alt: asset.name } };
  }
  return { type: "file", attrs: { href: asset.url, name: asset.name } };
}
