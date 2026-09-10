import { z } from "zod";
import { readAsset } from "../../assets/read-asset";
import { withRun } from "../runs/with-run";
import { sourceFor } from "../../codex/store/source-for";
import { rememberSources } from "../../codex/store/remember-sources";
export async function readSourceFile(
  userId: string,
  conversationId: string,
  runId: string,
  raw: unknown,
) {
  const input = z
    .object({
      assetId: z.uuid(),
      offset: z.number().int().min(0).max(20000000).default(0),
    })
    .parse(raw);
  return withRun(
    userId,
    conversationId,
    runId,
    async (tx, run, conversation) => {
      const { asset, bytes } = await readAsset(userId, input.assetId);
      const target = await sourceFor(tx, userId, run.workspaceId, asset.pageId);
      await rememberSources(tx, conversation, [target.source]);
      if (asset.mime.startsWith("image/")) {
        if (bytes.length > 4 * 1024 * 1024)
          throw new Error(
            "Cette image dépasse 4 Mo. Utilisez run_code pour la redimensionner.",
          );
        return {
          success: true,
          contentItems: [
            {
              type: "inputText",
              text: JSON.stringify({
                assetId: asset.id,
                name: asset.name,
                pageId: asset.pageId,
              }),
            },
            {
              type: "inputImage",
              imageUrl:
                "data:" + asset.mime + ";base64," + bytes.toString("base64"),
            },
          ],
        };
      }
      if (
        bytes.subarray(0, 1000).includes(0) ||
        /\.(zip|pdf|docx|xlsx|pptx)$/i.test(asset.name)
      )
        throw new Error(
          "Ce fichier binaire doit être traité avec run_code ; son contenu ne peut pas être lu comme du texte.",
        );
      const text = bytes.toString("utf8");
      return {
        assetId: asset.id,
        name: asset.name,
        pageId: asset.pageId,
        text: text.slice(input.offset, input.offset + 40000),
        nextOffset:
          text.length > input.offset + 40000 ? input.offset + 40000 : null,
      };
    },
  );
}
