import { spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { postgres } from "./postgres";

if (!process.argv[2]) {
  throw new Error("Indiquez le dossier de sauvegarde.");
}
const backup = resolve(process.argv[2]);
const manifest = JSON.parse(
  await readFile(join(backup, "manifest.json"), "utf8")
);
if (manifest.format !== "digipm-backup" || manifest.version !== 1) {
  throw new Error("Sauvegarde inconnue.");
}
const dbName = `digipm_restore_${Date.now()}`;
const destination = resolve(".data/restores", dbName);
await mkdir(destination, { recursive: true });
const started = Date.now();
postgres(["createdb", "-U", "digipm", dbName]);
const fd = openSync(join(backup, "database.dump"), "r");
try {
  postgres(
    ["pg_restore", "-U", "digipm", "--exit-on-error", "-d", dbName],
    [fd, "pipe", "pipe"]
  );
} finally {
  closeSync(fd);
}
const tar = spawnSync(
  "tar",
  ["-xzf", join(backup, "assets.tar.gz"), "-C", destination],
  { stdio: "inherit" }
);
if (tar.status !== 0) {
  throw new Error("Fichiers non restaurés.");
}
const keys = postgres([
  "psql",
  "-U",
  "digipm",
  "-d",
  dbName,
  "-At",
  "-c",
  "SELECT DISTINCT key FROM assets",
])
  .trim()
  .split("\n")
  .filter(Boolean);
await Promise.all(
  keys.map((key) => access(join(destination, manifest.assetsFolder, key)))
);
const counts = postgres([
  "psql",
  "-U",
  "digipm",
  "-d",
  dbName,
  "-At",
  "-c",
  "SELECT json_build_object('users',(SELECT count(*) FROM public.user),'pages',(SELECT count(*) FROM pages),'documents',(SELECT count(*) FROM page_documents),'entries',(SELECT count(*) FROM database_entries))",
]);
const report = {
  database: dbName,
  assetsPath: destination,
  durationMs: Date.now() - started,
  assetFiles: keys.length,
  counts: JSON.parse(counts),
};
await writeFile(
  join(destination, "verification.json"),
  JSON.stringify(report, null, 2)
);
console.info(JSON.stringify(report, null, 2));
