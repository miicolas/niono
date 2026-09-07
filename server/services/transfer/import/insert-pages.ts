import { type DatabaseTransaction, schema as s } from "@/db";
import { documentText } from "@/lib/editor/document-text";
import { required } from "@/server/lib/required";
import {
  remapAssetUrl,
  remapDocument,
} from "@/server/services/documents/remap";
import type { Archive } from "@/validators/transfer";
import type { IdMap } from "./id-map";
import { pageLevels } from "./page-levels";

/** Insère les pages niveau par niveau (parents d'abord) avec leurs documents remappés. */
export async function insertPages(
  tx: DatabaseTransaction,
  archive: Archive,
  ctx: { userId: string; workspaceId: string; pageMap: IdMap; assetMap: IdMap }
) {
  const base = Date.now();
  let index = 0;
  for (const level of pageLevels(archive.pages)) {
    const rows = level.map((page) => ({
      page,
      content: remapDocument(page.content, {
        pages: ctx.pageMap,
        assets: ctx.assetMap,
        workspaceId: ctx.workspaceId,
        missingAsset: "#fichier-non-inclus",
      }),
    }));
    // biome-ignore lint/nursery/noAwaitInLoop: chaque niveau dépend des parents insérés avant lui
    await tx.insert(s.pages).values(
      rows.map(({ page }) => ({
        id: required(ctx.pageMap.get(page.id)),
        workspaceId: ctx.workspaceId,
        parentId: page.parentId
          ? (ctx.pageMap.get(page.parentId) ?? null)
          : null,
        title: page.title,
        icon: page.icon,
        cover: page.cover
          ? remapAssetUrl(page.cover, ctx.assetMap, null)
          : null,
        kind: page.kind,
        privateRoot: page.privateRoot,
        createdBy: ctx.userId,
        position: base + index++,
      }))
    );
    await tx.insert(s.documents).values(
      rows.map(({ page, content }) => ({
        pageId: required(ctx.pageMap.get(page.id)),
        content,
        plainText: documentText(content),
      }))
    );
  }
}
