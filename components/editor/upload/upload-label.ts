/** Texte de l'aperçu affiché pendant l'envoi d'un lot de fichiers. */
export function uploadLabel(files: File[]) {
  const [first] = files;
  if (files.length === 1 && first) {
    return `Envoi de ${first.name}…`;
  }
  return `Envoi de ${files.length} fichiers…`;
}
