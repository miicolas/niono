import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");
const MAX_LINES = 300;
const SOURCE_FILE = /\.tsx?$/;
const SOURCE_ROOTS = [
  "components",
  "constants",
  "db",
  "emails",
  "env",
  "hooks",
  "lib",
  "orpc",
  "routes",
  "scripts",
  "server",
  "validators",
];
/** Fichiers générés ou importés tels quels, hors règle. */
const EXEMPT = [/^components\/ui\//, /routeTree\.gen\.ts$/];

/** Nombre de lignes au sens de `wc -l` : le saut de ligne final ne compte pas. */
function countLines(file: string): number {
  return readFileSync(file, "utf8").trimEnd().split("\n").length;
}

function listSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSources(path);
    }
    return SOURCE_FILE.test(entry.name) ? [path] : [];
  });
}

describe("taille des fichiers", () => {
  test(`aucun fichier source ne dépasse ${MAX_LINES} lignes`, () => {
    const offenders = SOURCE_ROOTS.flatMap((root) =>
      listSources(join(ROOT, root))
    )
      .map((file) => relative(ROOT, file))
      .filter((file) => !EXEMPT.some((pattern) => pattern.test(file)))
      .filter((file) => countLines(join(ROOT, file)) > MAX_LINES);
    expect(offenders).toEqual([]);
  });
});
