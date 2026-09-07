import { eq } from "drizzle-orm";
import { type DatabaseTransaction, schema as s } from "@/db";
import type { Page } from "@/db/schema/pages/types";
import { documentText } from "@/lib/editor/document-text";
import { required } from "@/server/lib/required";
import { accessPage } from "@/server/services/access/access-page";
import {
  remapAssetUrl,
  remapDocument,
} from "@/server/services/documents/remap";
import type { CopyMappings } from "./copy-mappings";

/** Copie une page, son document et ses fichiers ; la racine copiée prend le parent de l'original. */
export async function copyPage(
  tx: DatabaseTransaction,
  userId: string,
  root: Page,
  originalId: string,
  mappings: CopyMappings
) {
  const { page: original } = await accessPage(tx, userId, originalId);
  const [doc] = await tx
    .select()
    .from(s.documents)
    .where(eq(s.documents.pageId, originalId));
  const copied = remapDocument(required(doc).content, {
    pages: mappings.pages,
    assets: mappings.assets,
  });
  const isRoot = originalId === root.id;
  const newId = required(mappings.pages.get(originalId));
  await tx.insert(s.pages).values({
    ...original,
    id: newId,
    title: isRoot ? `${original.title} (copie)` : original.title,
    parentId: isRoot
      ? root.parentId
      : required(mappings.pages.get(required(original.parentId))),
    createdBy: userId,
    privateRoot: original.privateRoot,
    cover: original.cover
      ? remapAssetUrl(original.cover, mappings.assets, original.cover)
      : null,
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    position: Date.now(),
  });
  await tx.insert(s.documents).values({
    pageId: newId,
    content: copied,
    plainText: documentText(copied),
  });
  const assets = await tx
    .select()
    .from(s.assets)
    .where(eq(s.assets.pageId, originalId));
  if (assets.length) {
    await tx.insert(s.assets).values(
      assets.map((asset) => ({
        ...asset,
        id: required(mappings.assets.get(asset.id)),
        pageId: newId,
      }))
    );
  }
  return newId;
}
