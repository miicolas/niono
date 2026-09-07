import { eq } from "drizzle-orm";
import { schema as s } from "@/db";
import type { Page } from "@/db/schema/pages/types";
import { ancestry } from "./ancestry";
import type { Connection } from "./connection";
import { grantsFor } from "./grants-for";
import { resolveAccess } from "./resolve-access";

function workspaceMembers(cx: Connection, workspaceId: string) {
  return cx
    .select({ id: s.members.userId, name: s.user.name, role: s.members.role })
    .from(s.members)
    .innerJoin(s.user, eq(s.user.id, s.members.userId))
    .where(eq(s.members.workspaceId, workspaceId));
}

type Member = Awaited<ReturnType<typeof workspaceMembers>>[number];

async function audienceOf(
  cx: Connection,
  members: Member[],
  pageId: string | null
) {
  if (!pageId) {
    return members.map((m) => ({ ...m, canEdit: m.role !== "viewer" }));
  }
  const ancestors = await ancestry(cx, pageId);
  const grants = await grantsFor(
    cx,
    ancestors.map((a) => a.id)
  );
  return members.flatMap((member) => {
    const canEdit = resolveAccess(ancestors, grants, member.id, member.role);
    return canEdit === null ? [] : [{ ...member, canEdit }];
  });
}

/** Membres qui gagneraient un accès (lecture ou édition) si la page était déplacée sous `parentId`. */
export async function audienceChange(
  cx: Connection,
  page: Page,
  parentId: string | null
) {
  const members = await workspaceMembers(cx, page.workspaceId);
  const old = await audienceOf(cx, members, page.id);
  let next = await audienceOf(cx, members, parentId);
  if (page.privateRoot) {
    const grants = await cx
      .select()
      .from(s.grants)
      .where(eq(s.grants.pageId, page.id));
    next = next.flatMap((member) => {
      if (member.id === page.createdBy) {
        return [member];
      }
      const grant = grants.find((g) => g.userId === member.id);
      return grant
        ? [{ ...member, canEdit: member.canEdit && grant.role === "editor" }]
        : [];
    });
  }
  return next
    .filter((member) => {
      const before = old.find((m) => m.id === member.id);
      return !before || (!before.canEdit && member.canEdit);
    })
    .map((member) => ({
      id: member.id,
      name: member.name,
      access: member.canEdit ? ("edit" as const) : ("read" as const),
    }));
}
