import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { contextBindingSchema } from "@digipm/contracts/pm-os";
import { lockWorkspace, missing, type Connection } from "../../access";
import { sourceFor } from "../../codex/store/source-for";
export async function bindContext(
  userId: string,
  raw: unknown,
  connection: Connection = db,
) {
  const input = contextBindingSchema.parse(raw);
  return connection.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    await sourceFor(tx, userId, input.workspaceId, input.pageId, true);
    if (input.subjectId) {
      const [subject] = await tx
        .select()
        .from(s.pmSubjects)
        .where(
          and(
            eq(s.pmSubjects.id, input.subjectId),
            eq(s.pmSubjects.workspaceId, input.workspaceId),
          ),
        );
      if (!subject) throw missing();
      await sourceFor(tx, userId, input.workspaceId, subject.pageId, true);
    } else {
      const [settings] = await tx
        .select()
        .from(s.pmSettings)
        .where(eq(s.pmSettings.workspaceId, input.workspaceId));
      if (!settings) throw missing();
      await sourceFor(
        tx,
        userId,
        input.workspaceId,
        settings.companyPageId,
        true,
      );
    }
    const [binding] = await tx
      .insert(s.pmContextBindings)
      .values({ ...input, scope: input.subjectId ?? "workspace" })
      .onConflictDoUpdate({
        target: [
          s.pmContextBindings.workspaceId,
          s.pmContextBindings.scope,
          s.pmContextBindings.pageId,
        ],
        set: { role: input.role, updatedAt: new Date() },
      })
      .returning();
    return binding!;
  });
}
