import { safeUrl } from "./safe-url";
import { validateImageAttrs } from "./validate-image-attrs";

const HEADING_LEVELS = [1, 2, 3];
const TEXT_ALIGNMENTS = ["left", "center", "right", "justify"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Valide les attributs d'un nœud : URLs sûres, identifiants bornés, niveaux et alignements connus. */
export function validateNodeAttrs(attrs: unknown): boolean {
  if (attrs === undefined) {
    return true;
  }
  if (!isPlainObject(attrs)) {
    return false;
  }
  if (
    (attrs.src !== undefined && !safeUrl(attrs.src)) ||
    (attrs.href !== undefined && !safeUrl(attrs.href))
  ) {
    return false;
  }
  if (
    attrs.id !== undefined &&
    attrs.id !== null &&
    (typeof attrs.id !== "string" || attrs.id.length > 100)
  ) {
    return false;
  }
  if (
    attrs.level !== undefined &&
    !HEADING_LEVELS.includes(attrs.level as number)
  ) {
    return false;
  }
  if (attrs.checked !== undefined && typeof attrs.checked !== "boolean") {
    return false;
  }
  if (!validateImageAttrs(attrs)) {
    return false;
  }
  return (
    attrs.textAlign === undefined ||
    attrs.textAlign === null ||
    TEXT_ALIGNMENTS.includes(attrs.textAlign as string)
  );
}
