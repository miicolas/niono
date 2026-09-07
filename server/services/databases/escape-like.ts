const LIKE_SPECIALS = /[%_\\]/g;

/** Motif ILIKE « contient » avec les caractères spéciaux échappés. */
export function containsPattern(value: string): string {
  return `%${value.replace(LIKE_SPECIALS, "\\$&")}%`;
}
