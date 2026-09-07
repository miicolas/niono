type ReadResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: "empty" | "too-large" };

/**
 * Lit le corps d'une requête en mémoire, en abandonnant dès que la limite est
 * dépassée pour ne jamais mettre en tampon un fichier trop volumineux.
 */
export async function readRequestBytes(
  request: Request,
  limit: number
): Promise<ReadResult> {
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, reason: "empty" };
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    // biome-ignore lint/nursery/noAwaitInLoop: lecture séquentielle du flux
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return { ok: false, reason: "too-large" };
    }
    chunks.push(value);
  }
  if (!size) {
    return { ok: false, reason: "empty" };
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { ok: true, bytes };
}
