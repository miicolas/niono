import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PmPack } from "@digipm/contracts/pm-os";
import { pmDirectory } from "./directory";
const cache = new Map<string, PmPack>();
export async function readPack(
  version?: string | null,
): Promise<PmPack | null> {
  const root = pmDirectory();
  if (!version) {
    try {
      version = JSON.parse(
        await readFile(join(root, "current.json"), "utf8"),
      ).version;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  if (!version || !/^[a-f0-9]{64}$/.test(version))
    throw new Error("Version PM-OS invalide.");
  const key = root + "/" + version;
  if (cache.has(key)) return cache.get(key)!;
  const pack: PmPack = JSON.parse(
    await readFile(join(root, "packs", version + ".json"), "utf8"),
  );
  if (
    pack.version !== version ||
    !pack.resources["AGENTS.md"] ||
    !pack.resources["CLAUDE.md"]
  )
    throw new Error("Pack PM-OS incomplet.");
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        sourceRevision: pack.sourceRevision,
        resources: Object.fromEntries(
          Object.entries(pack.resources).sort(([a], [b]) => a.localeCompare(b)),
        ),
      }),
    )
    .digest("hex");
  if (hash !== version)
    throw new Error(
      "L’intégrité du pack PM-OS ne correspond pas à sa version.",
    );
  cache.set(key, pack);
  return pack;
}
