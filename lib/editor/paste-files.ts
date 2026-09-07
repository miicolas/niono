import { transferFiles } from "./transfer-files";

/**
 * Fichiers à importer depuis un collage. Un presse-papiers qui contient aussi
 * du texte vient d'une application (tableur, traitement de texte) qui joint une
 * image de son rendu : le collage habituel est alors bien plus utile.
 */
export function pasteFiles(data: DataTransfer | null): File[] {
  if (!data || data.getData("text/plain").trim()) {
    return [];
  }
  return transferFiles(data);
}
