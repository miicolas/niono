/**
 * Vrai lorsqu'un glisser en cours transporte des fichiers. Pendant le survol,
 * seuls les types sont exposés : les fichiers eux-mêmes n'arrivent qu'au dépôt.
 */
export function draggingFiles(data: DataTransfer | null): boolean {
  return Array.from(data?.types ?? []).includes("Files");
}
