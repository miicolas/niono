import {
  readdir,
  readFile,
  mkdir,
  writeFile,
  rename,
  lstat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import {
  pmWorkflows,
  reviewPersonas,
  type PmPack,
} from "@digipm/contracts/pm-os";
import { pmDirectory } from "./directory";
export async function importPack(source: string, destination = pmDirectory()) {
  const root = resolve(source);
  const resources: Record<string, string> = {};
  const pending = [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "LICENSE.md",
    ".claude/skills",
    "templates",
    "sub-agents",
    "context-library",
    "advanced",
    "setup",
  ];
  let total = 0;
  while (pending.length) {
    const relative = pending.shift()!;
    const path = join(root, relative);
    const stat = await lstat(path);
    if (stat.isSymbolicLink())
      throw new Error(
        "Les liens symboliques ne sont pas importés : " + relative,
      );
    if (stat.isDirectory()) {
      pending.push(
        ...(await readdir(path))
          .sort()
          .filter((name) => !name.startsWith("."))
          .map((name) => relative + "/" + name),
      );
    } else if (relative.endsWith(".md")) {
      if (stat.size > 300000 || (total += stat.size) > 8000000)
        throw new Error("Pack PM-OS trop volumineux.");
      resources[relative] = await readFile(path, "utf8");
    }
  }
  for (const workflow of pmWorkflows) {
    const path = ".claude/skills/" + workflow.id + "/SKILL.md";
    if (!resources[path]?.includes("name: " + workflow.id))
      throw new Error("Workflow absent ou invalide : " + workflow.id);
  }
  for (const persona of reviewPersonas)
    if (!resources["sub-agents/" + persona + ".md"])
      throw new Error("Persona absent : " + persona);
  const { stdout } = await promisify(execFile)("git", ["rev-parse", "HEAD"], {
    cwd: root,
  });
  const sourceRevision = stdout.trim();
  const ordered = Object.fromEntries(
    Object.entries(resources).sort(([a], [b]) => a.localeCompare(b)),
  );
  const version = createHash("sha256")
    .update(JSON.stringify({ sourceRevision, resources: ordered }))
    .digest("hex");
  const pack: PmPack = {
    version,
    sourceRevision,
    resources: ordered,
    importedAt: new Date().toISOString(),
  };
  await mkdir(join(destination, "packs"), { recursive: true, mode: 0o700 });
  await writeFile(
    join(destination, "packs", version + ".json"),
    JSON.stringify(pack),
    { mode: 0o600 },
  );
  const temporary = join(
    destination,
    "current-" + crypto.randomUUID() + ".json",
  );
  await writeFile(temporary, JSON.stringify({ version }), { mode: 0o600 });
  await rename(temporary, join(destination, "current.json"));
  return {
    version,
    sourceRevision,
    workflows: pmWorkflows.length,
    resources: Object.keys(resources).length,
    reviewers: reviewPersonas.length,
  };
}
