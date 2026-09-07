import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const routersRoot = resolve(import.meta.dir, "../../server/routers");
const getRoutePattern = /\.route\(\{\s*method:\s*"GET",?\s*\}\)/;

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listTypeScriptFiles(entryPath);
    }
    return entry.name.endsWith(".ts") ? [entryPath] : [];
  });
}

describe("router architecture", () => {
  test("keeps the routers root domain-first", () => {
    const entries = readdirSync(routersRoot, { withFileTypes: true });
    const rootTypeScriptFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => entry.name);
    const domains = entries.filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith("_")
    );

    expect(rootTypeScriptFiles).toEqual(["_app.ts"]);
    expect(domains.length).toBeGreaterThan(0);

    for (const domain of domains) {
      const domainFiles = readdirSync(join(routersRoot, domain.name));
      expect(domainFiles).toContain("router.ts");
    }
  });

  test("keeps router entry points limited to composition", () => {
    const routerFiles = listTypeScriptFiles(routersRoot).filter((file) =>
      file.endsWith("/router.ts")
    );

    for (const routerFile of routerFiles) {
      const source = readFileSync(routerFile, "utf8");
      expect(source).not.toContain(".handler(");
      expect(source).not.toContain(".input(");
      expect(source).not.toContain(".route(");
      expect(source).not.toContain(".use(");
    }
  });

  test("separates GET queries from write mutations", () => {
    const procedureFiles = listTypeScriptFiles(routersRoot).filter(
      (file) => !file.endsWith("/index.ts")
    );
    const queryFiles = procedureFiles.filter((file) =>
      file.includes("/queries/")
    );
    const mutationFiles = procedureFiles.filter((file) =>
      file.includes("/mutations/")
    );

    expect(queryFiles.length).toBeGreaterThan(0);
    expect(mutationFiles.length).toBeGreaterThan(0);

    for (const queryFile of queryFiles) {
      const source = readFileSync(queryFile, "utf8");
      expect(source).toMatch(getRoutePattern);
      expect(source).toContain(".handler(");
    }

    for (const mutationFile of mutationFiles) {
      const source = readFileSync(mutationFile, "utf8");
      expect(source).not.toContain(".route(");
      expect(source).toContain(".handler(");
    }
  });
});
