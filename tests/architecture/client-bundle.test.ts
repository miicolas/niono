import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ASSETS = resolve(import.meta.dir, "../../.output/public/assets");
/** Chaînes qui n'existent que dans le pilote PostgreSQL ou l'accès serveur au routeur. */
const SERVER_ONLY = ["node-postgres", "createRouterClient", "pg-pool"];

describe("bundle client", () => {
  test.skipIf(!existsSync(ASSETS))(
    "n'embarque ni le pilote PostgreSQL ni le routeur serveur",
    () => {
      const leaks = readdirSync(ASSETS)
        .filter((file) => file.endsWith(".js"))
        .flatMap((file) => {
          const source = readFileSync(join(ASSETS, file), "utf8");
          return SERVER_ONLY.filter((needle) => source.includes(needle)).map(
            (needle) => `${file}: ${needle}`
          );
        });
      expect(leaks).toEqual([]);
    }
  );
});
