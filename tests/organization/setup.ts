import { beforeAll } from "vitest";
import { auth } from "../../packages/server/src/auth";
import { createWorkspace } from "../../packages/server/src/pages";
import { account } from "./account";

export let owner: Awaited<ReturnType<typeof account>>;
export let editor: Awaited<ReturnType<typeof account>>;
export let outsider: Awaited<ReturnType<typeof account>>;
export let organizationId: string;
beforeAll(async () => {
  owner = await account("owner");
  editor = await account("editor");
  outsider = await account("outsider");
  organizationId = (
    await createWorkspace(owner.user.id, "Organisation Better Auth")
  ).id;
  await auth.api.addMember({
    body: { organizationId, userId: editor.user.id, role: "editor" },
  });
});
