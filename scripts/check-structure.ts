import { readFile, readdir } from "node:fs/promises";
import { extname } from "node:path";
import { collectSourceFiles } from "./structure/collect-source-files";
import { checkSourceFile } from "./structure/check-source-file";
import { sourceExtensions, sourceRoots } from "./structure/policy";

const groups = await Promise.all(sourceRoots.map(collectSourceFiles));
const files = [
  ...(await readdir(".")).filter((file) => sourceExtensions.has(extname(file))),
  ...groups.flat(),
];
const results = await Promise.all(
  files.map(async (file) =>
    checkSourceFile(file, await readFile(file, "utf8")),
  ),
);
const errors = results.flat();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Structure conforme : ${files.length} fichiers, au plus 300 lignes et une fonction autonome par fichier.`,
  );
