/** Positions possibles d'une image dans la colonne de texte. */
export const IMAGE_ALIGNMENTS = ["left", "center", "right"] as const;

export type ImageAlign = (typeof IMAGE_ALIGNMENTS)[number];

export const DEFAULT_IMAGE_ALIGN: ImageAlign = "center";

/** Ramène une valeur inconnue sur un alignement pris en charge. */
export function toImageAlign(value: unknown): ImageAlign {
  return (IMAGE_ALIGNMENTS as readonly unknown[]).includes(value)
    ? (value as ImageAlign)
    : DEFAULT_IMAGE_ALIGN;
}
