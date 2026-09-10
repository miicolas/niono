import { spawnSync } from "node:child_process";
import { readFile, mkdir, access, writeFile } from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { resolve, join } from "node:path";
if (!process.argv[2]) throw new Error("Indiquez le dossier de sauvegarde.");
const backup = resolve(process.argv[2]);
const manifest = JSON.parse(
  await readFile(join(backup, "manifest.json"), "utf8"),
);
if (manifest.format !== "digipm-backup" || manifest.version !== 1)
  throw new Error("Sauvegarde inconnue.");
const dbName = `digipm_restore_${Date.now()}`;
const destination = resolve(".data/restores", dbName);
await mkdir(destination, { recursive: true });
const started = Date.now();
function run(args: string[]) {
  const r = spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", ...args],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout;
}
run(["createdb", "-U", "digipm", dbName]);
const fd = openSync(join(backup, "database.dump"), "r");
const restored = spawnSync(
  "docker",
  [
    "compose",
    "exec",
    "-T",
    "postgres",
    "pg_restore",
    "-U",
    "digipm",
    "--exit-on-error",
    "-d",
    dbName,
  ],
  { stdio: [fd, "pipe", "pipe"], encoding: "utf8" },
);
closeSync(fd);
if (restored.status !== 0) throw new Error(restored.stderr);
const tar = spawnSync(
  "tar",
  ["-xzf", join(backup, "assets.tar.gz"), "-C", destination],
  { stdio: "inherit" },
);
if (tar.status !== 0) throw new Error("Fichiers non restaurés.");
if (manifest.codexFolder) {
  const codexTar = spawnSync(
    "tar",
    ["-xzf", join(backup, "codex.tar.gz"), "-C", destination],
    { stdio: "inherit" },
  );
  if (codexTar.status !== 0) throw new Error("Stockage Codex non restauré.");
  await access(join(destination, manifest.codexFolder));
}
const keys = run([
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
for (const key of keys)
  await access(join(destination, manifest.assetsFolder, key));
const counts = run([
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
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
