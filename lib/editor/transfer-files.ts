/** Fichiers portés par un presse-papiers ou un glisser-déposer, dans l'ordre. */
export function transferFiles(data: DataTransfer | null | undefined): File[] {
  if (!data) {
    return [];
  }
  const files = Array.from(data.files);
  if (files.length) {
    return files;
  }
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}
