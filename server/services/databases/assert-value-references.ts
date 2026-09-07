import { and, eq, inArray } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import type { PropertyDefinition } from "@/db/schema/databases/types";
import { accessPage } from "@/server/services/access/access-page";
import { missing } from "@/server/services/access/errors";
import type { PropertyValue } from "@/validators/databases";

/** Les personnes référencées doivent être membres de l'espace, les fichiers attachés à l'entrée. */
export async function assertValueReferences(
  tx: DatabaseTransaction,
  userId: string,
  pageId: string,
  property: PropertyDefinition,
  value: PropertyValue
) {
  if (!Array.isArray(value) || value.length === 0) {
    return;
  }
  if (property.type === "person") {
    const { page } = await accessPage(tx, userId, pageId);
    const members = await tx
      .select({ userId: s.members.userId })
      .from(s.members)
      .where(
        and(
          eq(s.members.workspaceId, page.workspaceId),
          inArray(s.members.userId, value)
        )
      );
    if (members.length !== new Set(value).size) {
      throw missing();
    }
  }
  if (property.type === "files") {
    const assets = await tx
      .select({ id: s.assets.id })
      .from(s.assets)
      .where(and(inArray(s.assets.id, value), eq(s.assets.pageId, pageId)));
    if (assets.length !== new Set(value).size) {
      throw missing();
    }
  }
}
