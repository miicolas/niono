const GIF_SIGNATURE = /^GIF8[79]a$/;
const AVIF_BRANDS = new Set(["avif", "avis"]);

/** Type MIME déduit des octets de signature ; tout autre contenu est servi en flux binaire. */
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
  if (GIF_SIGNATURE.test(Buffer.from(bytes.subarray(0, 6)).toString())) {
    return "image/gif";
  }
  if (
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    Buffer.from(bytes.subarray(4, 8)).toString() === "ftyp" &&
    AVIF_BRANDS.has(Buffer.from(bytes.subarray(8, 12)).toString())
  ) {
    return "image/avif";
  }
  return "application/octet-stream";
}
