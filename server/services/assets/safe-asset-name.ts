const MAX_NAME_LENGTH = 200;
const LAST_CONTROL_CHAR = 0x1f;

function isUnsafe(char: string): boolean {
  return (
    char === "/" || char === "\\" || char.charCodeAt(0) <= LAST_CONTROL_CHAR
  );
}

/** Nom de fichier sans séparateur ni caractère de contrôle, borné à 200 caractères. */
export const safeAssetName = (name: string) =>
  Array.from(name, (char) => (isUnsafe(char) ? "_" : char))
    .join("")
    .slice(0, MAX_NAME_LENGTH) || "Fichier";
