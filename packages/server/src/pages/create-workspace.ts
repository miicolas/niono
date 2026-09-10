import { auth } from "../auth";
import { randomUUID } from "node:crypto";
import { missing } from "../access";

// Organization and membership creation belong to Better Auth, including server-side onboarding.
export async function createWorkspace(userId: string, name: string) {
  const workspace = await auth.api.createOrganization({
    body: { userId, name, slug: `espace-${randomUUID()}` },
  });
  if (!workspace) throw missing();
  return workspace;
}
