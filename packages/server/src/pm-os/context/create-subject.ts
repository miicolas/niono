import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { pmSubjectSchema } from "@digipm/contracts/pm-os";
import { lockWorkspace, missing } from "../../access";
import { sourceFor } from "../../codex/store/source-for";
import { createPage } from "../../pages/create-page";
export async function createSubject(userId: string, raw: unknown) {
  const input = pmSubjectSchema.parse(raw);
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    const [existing] = await tx
      .select()
      .from(s.pmSubjects)
      .where(
        and(
          eq(s.pmSubjects.id, input.requestId),
          eq(s.pmSubjects.workspaceId, input.workspaceId),
        ),
      );
    if (existing) {
      await sourceFor(tx, userId, input.workspaceId, existing.pageId, true);
      return existing;
    }
    const page = input.pageId
      ? (await sourceFor(tx, userId, input.workspaceId, input.pageId, true))
          .page
      : await createPage(
          userId,
          { workspaceId: input.workspaceId, title: input.title },
          tx,
        );
    if (page.kind !== "page") throw missing();
    const drafts = await createPage(
      userId,
      {
        workspaceId: input.workspaceId,
        parentId: page.id,
        title: "Brouillons",
      },
      tx,
    );
    const [subject] = await tx
      .insert(s.pmSubjects)
      .values({
        id: input.requestId,
        workspaceId: input.workspaceId,
        pageId: page.id,
        draftsPageId: drafts.id,
        createdBy: userId,
      })
      .returning();
    return subject!;
  });
}
