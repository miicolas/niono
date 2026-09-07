import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../..");

function findBarrels(directory: string, inColocated: boolean): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findBarrels(
        path,
        inColocated || entry.name.startsWith("-components")
      );
    }
    return inColocated && entry.name === "index.ts" ? [path] : [];
  });
}

describe("composants colocalisés", () => {
  test("aucun index.ts n'existe sous un dossier -components", () => {
    const barrels = findBarrels(join(ROOT, "routes"), false).map((file) =>
      relative(ROOT, file)
    );
    expect(barrels).toEqual([]);
  });
});
