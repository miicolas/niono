import { db, schema as s } from "@digipm/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { pmWorkspaceSchema } from "@digipm/contracts/pm-os";
import { lockWorkspace, workspaceRole } from "../../access";
import { canEditWorkspace } from "../../permissions";
import { createPage } from "../../pages/create-page";
import { sourceFor } from "../../codex/store/source-for";
import { markdownDocument } from "../artifacts/markdown-document";
export async function configureWorkspace(userId: string, raw: unknown) {
  const input = pmWorkspaceSchema.parse(raw);
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if (!canEditWorkspace(await workspaceRole(tx, userId, input.workspaceId)))
      throw new ORPCError("FORBIDDEN");
    const [existing] = await tx
      .select()
      .from(s.pmSettings)
      .where(eq(s.pmSettings.workspaceId, input.workspaceId));
    if (existing) {
      await sourceFor(
        tx,
        userId,
        input.workspaceId,
        existing.companyPageId,
        true,
      );
      if (input.companyPageId && input.companyPageId !== existing.companyPageId)
        throw new ORPCError("CONFLICT", {
          message: "Ajoutez cette page aux références du contexte existant.",
        });
      const [updated] = await tx
        .update(s.pmSettings)
        .set({ companyName: input.companyName, updatedAt: new Date() })
        .where(eq(s.pmSettings.workspaceId, input.workspaceId))
        .returning();
      return updated!;
    }
    const company = input.companyPageId
      ? (
          await sourceFor(
            tx,
            userId,
            input.workspaceId,
            input.companyPageId,
            true,
          )
        ).page
      : await createPage(
          userId,
          {
            workspaceId: input.workspaceId,
            title: "Contexte " + input.companyName,
            content: markdownDocument(
              "# " +
                input.companyName +
                "\n\nContexte d’entreprise à compléter avec vos informations validées.\n\n## Produit et clients\n\n## Stratégie et objectifs\n\n## Parties prenantes\n\n## Style de communication",
            ),
          },
          tx,
        );
    const drafts = await createPage(
      userId,
      {
        workspaceId: input.workspaceId,
        parentId: company.id,
        title: "Brouillons transverses",
      },
      tx,
    );
    const [settings] = await tx
      .insert(s.pmSettings)
      .values({
        workspaceId: input.workspaceId,
        companyName: input.companyName,
        companyPageId: company.id,
        draftsPageId: drafts.id,
      })
      .returning();
    await tx.insert(s.pmContextBindings).values({
      workspaceId: input.workspaceId,
      scope: "workspace",
      pageId: company.id,
      role: "company",
    });
    return settings!;
  });
}
