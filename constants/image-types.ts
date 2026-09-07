/** Formats d'image reconnus par le serveur à la lecture des octets envoyés. */
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

/** Valeur de l'attribut `accept` d'un champ fichier réservé aux images. */
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");

/** Vrai lorsque le type MIME décrit une image prise en charge. */
export function isImageMime(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}
