import { expect, test } from "vitest";
import { auth } from "@/auth";
import { getPage } from "@/server/services/pages/get-page";
import { listPages } from "@/server/services/pages/list-pages";
import { createWorkspace } from "@/server/services/workspaces/create-workspace";

test("un nouvel espace possède une première page privée aux autres utilisateurs", async () => {
  const a = await auth.api.signUpEmail({
    body: {
      name: "Alice",
      email: `alice-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
  });
  const b = await auth.api.signUpEmail({
    body: {
      name: "Bob",
      email: `bob-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
  });
  const workspace = await createWorkspace(a.user.id, "Atelier");
  const result = await listPages(a.user.id, workspace.id);
  expect(result.length).toBeGreaterThan(0);
  expect((await getPage(a.user.id, result[0]!.id)).page.title).toBe(
    "Bienvenue dans votre espace"
  );
  await expect(getPage(b.user.id, result[0]!.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});
