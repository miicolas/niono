import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
const destination = resolve(
  process.argv[2] ??
    `.data/backups/${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
await mkdir(destination, { recursive: true });
const assetRoot = resolve(process.env.ASSET_DIR ?? ".data/assets");
const started = Date.now();
const fd = openSync(join(destination, "database.dump"), "wx", 0o600);
const result = spawnSync(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "postgres",
    "pg_dump",
    "-U",
    "digipm",
    "-Fc",
    "digipm",
  ],
  { stdio: ["ignore", fd, "inherit"] },
);
closeSync(fd);
if (result.status !== 0) throw new Error("Échec de la sauvegarde PostgreSQL.");
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
