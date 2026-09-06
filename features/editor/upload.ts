export async function uploadFile(pageId: string, file: File) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Le fichier dépasse la limite de 20 Mo.");
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
    throw new Error("Le fichier n’a pas pu être envoyé.");
  }
  return (await response.json()) as {
    id: string;
    url: string;
    name: string;
    mime: string;
  };
}
