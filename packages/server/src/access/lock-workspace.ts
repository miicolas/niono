import { schema as s, type Transaction } from "@digipm/db";
import { eq } from "drizzle-orm";

export async function lockWorkspace(cx: Transaction, workspaceId: string) {
  await cx
    .select({ id: s.organization.id })
    .from(s.organization)
    .where(eq(s.organization.id, workspaceId))
    .for("update");
}
