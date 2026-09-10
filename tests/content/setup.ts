import { beforeAll } from "vitest";
import { auth } from "../../packages/server/src/auth";
import * as pages from "../../packages/server/src/pages";

export let owner: string, editor: string, viewer: string, workspaceId: string;
beforeAll(async () => {
  const ids = await Promise.all(
    ["owner", "editor", "viewer"].map(
      async (name) =>
        (
          await auth.api.signUpEmail({
            body: {
              name,
              email: `${name}-${crypto.randomUUID()}@example.test`,
              password: "Test-password-812!",
            },
          })
        ).user.id,
    ),
  );
  [owner, editor, viewer] = ids as [string, string, string];
  workspaceId = (await pages.createWorkspace(owner, "Test contenu")).id;
  await auth.api.addMember({
    body: { organizationId: workspaceId, userId: editor, role: "editor" },
  });
  await auth.api.addMember({
    body: { organizationId: workspaceId, userId: viewer, role: "viewer" },
  });
});
