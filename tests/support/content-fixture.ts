import { auth } from "@/auth";
import { db, schema as s } from "@/db";
import type { DocumentNode } from "@/lib/editor/document-node";
import { createWorkspace } from "@/server/services/workspaces/create-workspace";

export type ContentFixture = {
  owner: string;
  editor: string;
  viewer: string;
  workspaceId: string;
};

/** Document d'un seul paragraphe, pratique pour les tests de contenu. */
export const content = (text: string): DocumentNode => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

async function signUp(name: string) {
  const result = await auth.api.signUpEmail({
    body: {
      name,
      email: `${name}-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
  });
  return result.user.id;
}

/** Trois comptes synthétiques (propriétaire, éditeur, lecteur) et un espace partagé. */
export async function createContentFixture(): Promise<ContentFixture> {
  const [owner, editor, viewer] = await Promise.all(
    ["owner", "editor", "viewer"].map(signUp)
  );
  if (!(owner && editor && viewer)) {
    throw new Error("Impossible de créer les comptes de test.");
  }
  const workspaceId = (await createWorkspace(owner, "Test contenu")).id;
  await db.insert(s.members).values([
    { workspaceId, userId: editor, role: "editor" },
    { workspaceId, userId: viewer, role: "viewer" },
  ]);
  return { owner, editor, viewer, workspaceId };
}
