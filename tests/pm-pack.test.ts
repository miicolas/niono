import { test, expect } from "vitest";
import { pmWorkflows, reviewPersonas } from "../packages/contracts/src/pm-os";
import { pmFixture } from "./pm/fixture";
import { pmInstructions } from "../packages/server/src/pm-os/pack/instructions";
import { loadResource } from "../packages/server/src/pm-os/tools/load-resource";
import { pmDynamicTools } from "../packages/server/src/pm-os/tools/definitions";
test("les 41 workflows se chargent intégralement avec leurs ressources et l’adaptation hôte", async () => {
  const f = await pmFixture();
  expect(pmWorkflows).toHaveLength(41);
  expect(new Set(pmWorkflows.map((workflow) => workflow.id)).size).toBe(41);
  for (const workflow of pmWorkflows) {
    const path = ".claude/skills/" + workflow.id + "/SKILL.md";
    const loaded = await loadResource(
      f.userId,
      f.conversationId,
      f.runId,
      path,
      workflow.id,
    );
    expect(loaded.content).toBe(f.pack.resources[path]);
    const instructions = pmInstructions(f.pack, workflow.id);
    expect(instructions).toContain(loaded.content);
    expect(instructions).toContain(f.pack.resources["CLAUDE.md"]);
    expect(instructions).toContain("ask_questions");
    expect(instructions).toContain("propositions de suites");
    expect(instructions).toContain("create_artifact");
  }
  for (const [path, content] of Object.entries(f.pack.resources))
    expect(
      (await loadResource(f.userId, f.conversationId, f.runId, path)).content,
    ).toBe(content);
  for (const persona of reviewPersonas)
    expect(f.pack.resources["sub-agents/" + persona + ".md"]).toBeTruthy();
  expect(pmDynamicTools.map((tool) => tool.name)).toEqual(
    expect.arrayContaining([
      "review_document",
      "run_code",
      "read_source_file",
      "ask_questions",
    ]),
  );
  await expect(
    loadResource(f.userId, f.conversationId, f.runId, "../../.env"),
  ).rejects.toThrow("n’existe pas");
});
