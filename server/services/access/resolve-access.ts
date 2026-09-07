import type { Ancestor } from "./ancestry";

type Grant = { pageId: string; userId: string; role: string };

/** Resolves whether `userId` may see the page; returns null when blocked, else the edit permission. */
export function resolveAccess(
  ancestors: Ancestor[],
  grants: Grant[],
  userId: string,
  role: string
) {
  let canEdit = role !== "viewer";
  for (const ancestor of ancestors) {
    if (!ancestor.private_root || ancestor.created_by === userId) {
      continue;
    }
    const grant = grants.find(
      (g) => g.pageId === ancestor.id && g.userId === userId
    );
    if (!grant) {
      return null;
    }
    if (grant.role === "viewer") {
      canEdit = false;
    }
  }
  return canEdit;
}
