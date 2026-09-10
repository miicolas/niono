import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  excludedDirectories,
  generatedPaths,
  sourceExtensions,
} from "./policy";

export async function collectSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (
        entry.isDirectory() &&
        (entry.name.startsWith(".") || excludedDirectories.has(entry.name))
      )
        return [];
      const file = join(root, entry.name).replaceAll("\\", "/");
      if (generatedPaths.some((path) => file === path || file.startsWith(path)))
        return [];
      if (entry.isDirectory()) return collectSourceFiles(file);
      return entry.isFile() && sourceExtensions.has(extname(file))
        ? [file]
        : [];
    }),
  );
  return files.flat().sort();
}
