import { client } from "@/lib/api";
export async function importPmSource(
  workspaceId: string,
  parentId: string,
  subjectId: string | null,
  file: File,
) {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("Choisissez un fichier de 20 Mo maximum.");
  const page = await client.pages.create({
    workspaceId,
    parentId,
    title: file.name,
  });
  const response = await fetch("/api/assets/" + page.id, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
    },
    body: file,
    credentials: "same-origin",
  });
  if (!response.ok)
    throw new Error(
      "L’import a échoué. La page vide reste disponible pour réessayer.",
    );
  const asset = (await response.json()) as {
    id: string;
    url: string;
    name: string;
    size: number;
    mime: string;
  };
  await client.pages.save({
    pageId: page.id,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: {
      type: "doc",
      content: [
        {
          type: "file",
          attrs: { id: crypto.randomUUID(), href: asset.url, name: asset.name },
        },
      ],
    },
  });
  await client.pm.bindContext({
    workspaceId,
    subjectId,
    pageId: page.id,
    role: "reference",
  });
  return page;
}
