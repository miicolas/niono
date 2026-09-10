import { readdir, lstat, readFile } from "node:fs/promises";
import { join } from "node:path";
export async function collectOutputs(
  root,
  prefix = "",
  budget = { bytes: 0, files: 0 },
) {
  const files = [];
  for (const entry of await readdir(join(root, prefix), {
    withFileTypes: true,
  })) {
    const path = prefix ? prefix + "/" + entry.name : entry.name;
    if (path.length > 200 || path.split("/").length > 10)
      throw new Error("Chemin de sortie trop long.");
    const stat = await lstat(join(root, path));
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()))
      throw new Error("Les sorties doivent être des fichiers ordinaires.");
    if (stat.isDirectory())
      files.push(...(await collectOutputs(root, path, budget)));
    else {
      budget.bytes += stat.size;
      budget.files++;
      if (
        stat.size > 20 * 1024 * 1024 ||
        budget.bytes > 50 * 1024 * 1024 ||
        budget.files > 50
      )
        throw new Error("Les sorties dépassent les limites autorisées.");
      files.push({
        path,
        data: (await readFile(join(root, path))).toString("base64"),
      });
    }
  }
  return files;
}
