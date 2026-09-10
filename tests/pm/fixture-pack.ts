import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  pmWorkflows,
  reviewPersonas,
  type PmPack,
} from "../../packages/contracts/src/pm-os";
import { readPack } from "../../packages/server/src/pm-os/pack/read-pack";
import { pmDirectory } from "../../packages/server/src/pm-os/pack/directory";
export async function fixturePack() {
  const existing = await readPack();
  if (existing) return existing;
  const resources = Object.fromEntries(
    Object.entries({
      "AGENTS.md": "Instructions de test, sans contexte métier réel.",
      "CLAUDE.md": "Les références restent des exemples.",
      "LICENSE.md": "Pack de test DigiPM",
      ...Object.fromEntries(
        pmWorkflows.map((workflow) => [
          ".claude/skills/" + workflow.id + "/SKILL.md",
          "---\nname: " +
            workflow.id +
            "\n---\n# Workflow de test\nLire le contexte, questionner et créer le brouillon.",
        ]),
      ),
      ...Object.fromEntries(
        reviewPersonas.map((persona) => [
          "sub-agents/" + persona + ".md",
          "# " + persona + "\nRetourner une relecture structurée.",
        ]),
      ),
    }).sort(([a], [b]) => a.localeCompare(b)),
  );
  const sourceRevision = "fixture";
  const version = createHash("sha256")
    .update(JSON.stringify({ sourceRevision, resources }))
    .digest("hex");
  const pack: PmPack = {
    sourceRevision,
    version,
    resources,
    importedAt: new Date().toISOString(),
  };
  const directory = pmDirectory();
  await mkdir(join(directory, "packs"), { recursive: true, mode: 0o700 });
  await writeFile(
    join(directory, "packs", version + ".json"),
    JSON.stringify(pack),
    { mode: 0o600 },
  );
  await writeFile(
    join(directory, "current.json"),
    JSON.stringify({ version }),
    { mode: 0o600 },
  );
  return pack;
}
