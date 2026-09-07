/** Largeur d'une image, en pourcentage de la largeur du texte. */
export const MIN_IMAGE_WIDTH = 10;
export const MAX_IMAGE_WIDTH = 100;

/** Ramène une largeur libre dans les bornes affichables. */
export function clampImageWidth(value: number) {
  return Math.min(
    MAX_IMAGE_WIDTH,
    Math.max(MIN_IMAGE_WIDTH, Math.round(value))
  );
}
