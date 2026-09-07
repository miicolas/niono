import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";

/** Verrouille la ligne de l'espace pour sérialiser les écritures concurrentes. */
export async function lockWorkspace(
  cx: DatabaseTransaction,
  workspaceId: string
) {
  await cx
    .select({ id: s.workspaces.id })
    .from(s.workspaces)
    .where(eq(s.workspaces.id, workspaceId))
    .for("update");
}
