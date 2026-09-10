import { documentText } from "@digipm/contracts";
import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { conversationFor } from "../../codex/store/conversation-for";
import { sourceFor } from "../../codex/store/source-for";
import { readAsset } from "../../assets/read-asset";
import { documentMarkdown } from "./document-markdown";
import { missing } from "../../access";
export async function previewArtifact(
  userId: string,
  conversationId: string,
  artifactId: string,
) {
  const conversation = await conversationFor(userId, conversationId);
  const [entry] = await db
    .select({ artifact: s.pmArtifacts })
    .from(s.pmArtifacts)
    .innerJoin(s.pmRuns, eq(s.pmRuns.id, s.pmArtifacts.runId))
    .where(
      and(
        eq(s.pmArtifacts.id, artifactId),
        eq(s.pmRuns.conversationId, conversationId),
      ),
    );
  if (!entry) throw missing();
  const target = await sourceFor(
    db,
    userId,
    conversation.workspaceId,
    entry.artifact.pageId,
  );
  const { asset, bytes } = await readAsset(userId, entry.artifact.assetId);
  const code = target.document.content.content?.filter(
    (node) => node.type === "codeBlock",
  );
  const editedText = code?.length ? code.map(documentText).join("\n\n") : null;
  if (entry.artifact.format === "html" && bytes.length > 1000000 && !editedText)
    throw new Error(
      "Ce prototype dépasse la limite de l’aperçu. Téléchargez son fichier pour l’ouvrir.",
    );
  return {
    truncated:
      !editedText &&
      entry.artifact.format !== "markdown" &&
      bytes.length > 1000000,
    format: entry.artifact.format,
    name: asset.name,
    text:
      entry.artifact.format === "markdown"
        ? documentMarkdown(target.document.content)
        : ["html", "code", "csv", "json"].includes(entry.artifact.format)
          ? (editedText ?? bytes.toString("utf8").slice(0, 1000000))
          : null,
    documentRevision: target.document.revision,
    exportRevision: entry.artifact.documentRevision,
    url: "/api/assets/" + asset.id,
  };
}
