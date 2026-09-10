import { createHash } from "node:crypto";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { createArtifactSchema } from "@digipm/contracts/pm-os";
import { withRun } from "../runs/with-run";
import { createPage } from "../../pages/create-page";
import { saveDocument } from "../../pages/save-document";
import { storeAsset } from "../../assets/store-asset";
import { imageMime } from "../../assets/image-mime";
import { assetDirectory } from "../../assets/asset-directory";
import { sourceFor } from "../../codex/store/source-for";
import { rememberSources } from "../../codex/store/remember-sources";
import { markdownDocument } from "./markdown-document";
export async function createArtifact(
  userId: string,
  conversationId: string,
  runId: string,
  raw: unknown,
) {
  const input = createArtifactSchema.parse(raw);
  const body = input.text ?? input.data ?? "";
  if (
    input.encoding === "base64" &&
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      body,
    )
  )
    throw new Error("Fichier encodé invalide.");
  const bytes = Buffer.from(
    body,
    input.encoding === "base64" ? "base64" : "utf8",
  );
  if (!bytes.length || bytes.length > 20 * 1024 * 1024)
    throw new Error("Le fichier doit faire entre 1 octet et 20 Mo.");
  if (
    input.format === "image" &&
    imageMime(bytes) === "application/octet-stream"
  )
    throw new Error("Image non reconnue (PNG, JPEG, GIF ou WebP requis).");
  if (input.format === "json") JSON.parse(bytes.toString("utf8"));
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        title: input.title,
        name: input.name,
        format: input.format,
        description: input.description,
      }),
    )
    .update(bytes)
    .digest("hex");
  let storageKey: string | null = null;
  try {
    return await withRun(
      userId,
      conversationId,
      runId,
      async (tx, run, conversation) => {
        const [existing] = await tx
          .select({ artifact: s.pmArtifacts, asset: s.assets })
          .from(s.pmArtifacts)
          .innerJoin(s.assets, eq(s.assets.id, s.pmArtifacts.assetId))
          .where(
            and(
              eq(s.pmArtifacts.runId, runId),
              eq(s.pmArtifacts.key, input.key),
            ),
          );
        if (existing) {
          if (existing.artifact.hash !== hash)
            throw new ORPCError("CONFLICT", {
              message:
                "Ce livrable existe déjà. Proposez une modification de sa page.",
            });
          const target = await sourceFor(
            tx,
            userId,
            run.workspaceId,
            existing.artifact.pageId,
          );
          return {
            ...existing.artifact,
            name: existing.asset.name,
            title: target.page.title,
            url: "/api/assets/" + existing.asset.id,
          };
        }
        const [parent] = run.subjectId
          ? await tx
              .select({ pageId: s.pmSubjects.draftsPageId })
              .from(s.pmSubjects)
              .where(
                and(
                  eq(s.pmSubjects.id, run.subjectId),
                  eq(s.pmSubjects.workspaceId, run.workspaceId),
                ),
              )
          : await tx
              .select({ pageId: s.pmSettings.draftsPageId })
              .from(s.pmSettings)
              .where(eq(s.pmSettings.workspaceId, run.workspaceId));
        if (!parent)
          throw new ORPCError("PRECONDITION_FAILED", {
            message:
              "Initialisez le contexte PM-OS avant de créer un livrable.",
          });
        const source = await sourceFor(
          tx,
          userId,
          run.workspaceId,
          parent.pageId,
          true,
        );
        const content = markdownDocument(
          input.format === "markdown"
            ? bytes.toString("utf8")
            : input.description || input.title,
        );
        if (
          ["csv", "json", "html", "code"].includes(input.format) &&
          bytes.length <= 1000000 &&
          !bytes.includes(0)
        )
          content.content!.push({
            type: "codeBlock",
            attrs: {
              language: input.format === "code" ? "plaintext" : input.format,
              id: crypto.randomUUID(),
            },
            content: [{ type: "text", text: bytes.toString("utf8") }],
          });
        const page = await createPage(
          userId,
          {
            workspaceId: run.workspaceId,
            parentId: parent.pageId,
            title: input.title,
            content,
          },
          tx,
        );
        const asset = await storeAsset(userId, page.id, input.name, bytes, tx);
        const [stored] = await tx
          .select()
          .from(s.assets)
          .where(eq(s.assets.id, asset.id));
        storageKey = stored!.key;
        let revision = 0;
        if (input.format !== "markdown") {
          const node =
            input.format === "image"
              ? {
                  type: "image",
                  attrs: {
                    src: asset.url,
                    alt: input.title,
                    id: crypto.randomUUID(),
                  },
                }
              : {
                  type: "file",
                  attrs: {
                    href: asset.url,
                    name: asset.name,
                    id: crypto.randomUUID(),
                  },
                };
          const saved = await saveDocument(
            userId,
            {
              pageId: page.id,
              content: {
                ...content,
                content: [...(content.content ?? []), node],
              },
              expectedRevision: 0,
              mutationId: crypto.randomUUID(),
            },
            tx,
          );
          revision = saved.revision;
        }
        const [artifact] = await tx
          .insert(s.pmArtifacts)
          .values({
            runId,
            key: input.key,
            hash,
            pageId: page.id,
            assetId: asset.id,
            format: input.format,
            documentRevision: revision,
          })
          .returning();
        await rememberSources(tx, conversation, [
          source.source,
          { pageId: page.id, title: page.title, revision },
        ]);
        return {
          ...artifact!,
          name: asset.name,
          title: page.title,
          url: asset.url,
        };
      },
    );
  } catch (error) {
    if (storageKey)
      await unlink(join(assetDirectory(), storageKey)).catch(() => {});
    throw error;
  }
}
