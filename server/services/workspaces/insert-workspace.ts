import { type DatabaseTransaction, schema as s } from "@/db";
import { documentText } from "@/lib/editor/document-text";
import { required } from "@/server/lib/required";
import { welcomeDocument } from "@/server/services/workspaces/welcome-document";

/** Crée l'espace, son propriétaire et sa page d'accueil dans la transaction donnée. */
export async function insertWorkspace(
  tx: DatabaseTransaction,
  userId: string,
  name: string
) {
  const [workspace] = await tx
    .insert(s.workspaces)
    .values({ name, createdBy: userId })
    .returning();
  await tx
    .insert(s.members)
    .values({ workspaceId: required(workspace).id, userId, role: "owner" });
  const [page] = await tx
    .insert(s.pages)
    .values({
      workspaceId: required(workspace).id,
      title: "Bienvenue dans votre espace",
      icon: "✳️",
      createdBy: userId,
    })
    .returning();
  await tx.insert(s.documents).values({
    pageId: required(page).id,
    content: welcomeDocument,
    plainText: documentText(welcomeDocument),
  });
  return required(workspace);
}
