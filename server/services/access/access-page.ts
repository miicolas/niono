import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { ancestry } from "./ancestry";
import type { Connection } from "./connection";
import { missing } from "./errors";
import { grantsFor } from "./grants-for";
import { resolveAccess } from "./resolve-access";
import { workspaceRole } from "./workspace-role";

export type PageAccess = Awaited<ReturnType<typeof accessPage>>;

/** Charge une page et vérifie que l'utilisateur peut la voir (et la modifier si `write`). */
export async function accessPage(
  cx: Connection,
  userId: string,
  pageId: string,
  write = false,
  includeDeleted = false
) {
  const [page] = await cx.select().from(s.pages).where(eq(s.pages.id, pageId));
  if (!page) {
    throw missing();
  }
  const role = await workspaceRole(cx, userId, page.workspaceId);
  const ancestors = await ancestry(cx, pageId);
  if (!includeDeleted && ancestors.some((a) => a.deleted_at)) {
    throw missing();
  }
  const privateIds = ancestors.filter((a) => a.private_root).map((a) => a.id);
  const grants = privateIds.length
    ? await grantsFor(cx, privateIds, userId)
    : [];
  const canEdit = resolveAccess(ancestors, grants, userId, role);
  if (canEdit === null) {
    throw missing();
  }
  if (write && !canEdit) {
    throw new ORPCError("FORBIDDEN", {
      message: "Cette page est en lecture seule.",
    });
  }
  return { page, canEdit, role };
}
