import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { postgres } from "./lib/postgres";
const destination = resolve(
  process.argv[2] ??
    `.data/backups/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(destination, { recursive: true });
const assetRoot = resolve(process.env.ASSET_DIR ?? ".data/assets");
const started = Date.now();
const fd = openSync(join(destination, "database.dump"), "wx", 0o600);
try {
  postgres(
    ["pg_dump", "-U", "digipm", "-Fc", "digipm"],
    ["ignore", fd, "inherit"],
  );
} finally {
  closeSync(fd);
}
const tar = spawnSync(
  "tar",
  [
    "-czf",
    join(destination, "assets.tar.gz"),
    "-C",
    dirname(assetRoot),
    basename(assetRoot),
  ],
  { stdio: "inherit" },
);
if (tar.status !== 0) throw new Error("Échec de la sauvegarde des fichiers.");
await writeFile(
  join(destination, "manifest.json"),
  JSON.stringify(
    {
      format: "digipm-backup",
      version: 1,
      createdAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      assetsFolder: basename(assetRoot),
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(`Sauvegarde : ${destination} (${Date.now() - started} ms)`);
