import { type DatabaseTransaction, schema as s } from "@/db";
import { required } from "@/server/lib/required";
import { defaultViewConfig } from "@/validators/databases";

/** Crée la source de données d'une nouvelle base avec sa propriété Statut et sa vue Table. */
export async function createSource(
  tx: DatabaseTransaction,
  pageId: string,
  workspaceId: string
) {
  const [source] = await tx
    .insert(s.sources)
    .values({ pageId, workspaceId })
    .returning();
  const sourceId = required(source).id;
  await tx.insert(s.properties).values({
    sourceId,
    name: "Statut",
    type: "status",
    options: [
      { id: "todo", name: "À faire", color: "gray" },
      { id: "progress", name: "En cours", color: "blue" },
      { id: "done", name: "Terminé", color: "green" },
    ],
  });
  await tx.insert(s.views).values({
    sourceId,
    name: "Table",
    config: defaultViewConfig,
  });
}
