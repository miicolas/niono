import { MAX_ASSET_BYTES } from "@/constants/limits";

export type UploadedAsset = {
  id: string;
  url: string;
  name: string;
  mime: string;
};

async function failureMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : fallback;
  } catch {
    return fallback;
  }
}

/** Envoie un fichier sur une page et renvoie l'adresse à laquelle le relire. */
export async function uploadFile(pageId: string, file: File) {
  if (!file.size) {
    throw new Error(`« ${file.name} » est vide.`);
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(`« ${file.name} » dépasse la limite de 20 Mo.`);
  }
  const response = await fetch(`/api/assets/${pageId}`, {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    },
  });
  if (!response.ok) {
    throw new Error(
      await failureMessage(response, `« ${file.name} » n’a pas pu être envoyé.`)
    );
  }
  return (await response.json()) as UploadedAsset;
}
