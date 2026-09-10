export function validateTask(raw) {
  if (
    !raw ||
    !["python", "node", "prototype"].includes(raw.runtime) ||
    !Array.isArray(raw.files) ||
    raw.files.length > 70
  )
    throw new Error("Calcul invalide.");
  const paths = new Set();
  let size = 0;
  for (const file of raw.files) {
    if (
      !file ||
      typeof file.path !== "string" ||
      file.path.length > 240 ||
      !/^[^\\\0]+$/.test(file.path) ||
      file.path.startsWith("/") ||
      file.path
        .split("/")
        .some(
          (part) =>
            !part || part === "." || part === ".." || part === "node_modules",
        ) ||
      paths.has(file.path) ||
      typeof file.data !== "string" ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        file.data,
      )
    )
      throw new Error("Fichier de calcul invalide.");
    paths.add(file.path);
    const bytes = Buffer.byteLength(file.data, "base64");
    size += bytes;
    if (bytes > 20 * 1024 * 1024 || size > 50 * 1024 * 1024)
      throw new Error("Entrées trop volumineuses.");
  }
  if (!paths.has(raw.entrypoint) || raw.entrypoint.startsWith("inputs/"))
    throw new Error("Point d’entrée invalide.");
  return { runtime: raw.runtime, entrypoint: raw.entrypoint, files: raw.files };
}
