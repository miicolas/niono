import { schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { type Connection } from "./shared";
import { pageAudience } from "./page-audience";

export async function audienceChange(
  cx: Connection,
  page: typeof s.pages.$inferSelect,
  parentId: string | null,
) {
  const old = await pageAudience(cx, page.workspaceId, page.id);
  let next = await pageAudience(cx, page.workspaceId, parentId);
  if (page.privateRoot) {
    const grants = await cx
      .select()
      .from(s.grants)
      .where(eq(s.grants.pageId, page.id));
    next = next.flatMap((member) => {
      if (member.id === page.createdBy) return [member];
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
