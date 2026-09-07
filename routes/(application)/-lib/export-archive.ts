import { download } from "@/lib/ui/download";
import { orpcClient } from "@/orpc/client";
/** Télécharge l'archive JSON de la page, de ses sous-pages et de leurs fichiers. */
export async function exportArchive(pageId: string, title: string) {
  const archive = await orpcClient.transfer.export({
    pageId,
    includeAssets: true,
  });
  download(
    `${title}-archive.json`,
    JSON.stringify(archive, null, 2),
    "application/json"
  );
}
