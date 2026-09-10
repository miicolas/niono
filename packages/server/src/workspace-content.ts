import { db, schema as s, type Transaction } from "@digipm/db";
import { eq } from "drizzle-orm";
import { documentText, type DocumentNode } from "@digipm/contracts";

const welcome: DocumentNode = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Un endroit pour vos idées, vos projets et tout ce qui compte.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Faites comme chez vous" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Commencez à écrire, ou tapez / pour ajouter un bloc. Sélectionnez du texte pour le mettre en forme.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Écrire votre première idée" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Créer une page pour votre prochain projet",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Les grandes choses commencent souvent par une simple note.",
            },
          ],
        },
      ],
    },
    { type: "paragraph" },
  ],
};
export async function initializeWorkspaceContent(
  connection: typeof db | Transaction,
  workspaceId: string,
  userId: string,
) {
  await connection.transaction(async (tx) => {
    await tx
      .select({ id: s.organization.id })
      .from(s.organization)
      .where(eq(s.organization.id, workspaceId))
      .for("update");
    const [existing] = await tx
      .select({ id: s.pages.id })
      .from(s.pages)
      .where(eq(s.pages.workspaceId, workspaceId))
      .limit(1);
    if (existing) return;
    const [page] = await tx
      .insert(s.pages)
      .values({
        workspaceId,
        title: "Bienvenue dans votre espace",
        icon: "✳️",
        createdBy: userId,
      })
      .returning();
    await tx.insert(s.documents).values({
      pageId: page!.id,
      content: welcome,
      plainText: documentText(welcome),
    });
  });
}
