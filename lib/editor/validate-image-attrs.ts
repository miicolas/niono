import { IMAGE_ALIGNMENTS } from "./image-align";
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from "./image-width";

/** Longueur maximale du texte alternatif, appliquée à la saisie comme au document. */
export const MAX_ALT_LENGTH = 300;

function validWidth(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_IMAGE_WIDTH &&
    value <= MAX_IMAGE_WIDTH
  );
}

/**
 * Valide la mise en forme portée par une image : la largeur devient une valeur
 * CSS, elle doit donc rester un nombre borné et l'alignement une valeur connue.
 */
export function validateImageAttrs(attrs: Record<string, unknown>): boolean {
  if (
    attrs.width !== undefined &&
    attrs.width !== null &&
    !validWidth(attrs.width)
  ) {
    return false;
  }
  if (
    attrs.align !== undefined &&
    attrs.align !== null &&
    !(IMAGE_ALIGNMENTS as readonly unknown[]).includes(attrs.align)
  ) {
    return false;
  }
  return (
    attrs.alt === undefined ||
    attrs.alt === null ||
    (typeof attrs.alt === "string" && attrs.alt.length <= MAX_ALT_LENGTH)
  );
}
