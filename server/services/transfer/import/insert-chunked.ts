const CHUNK = 500;

/** Insère les lignes par lots de 500, dans l'ordre, sur la même transaction. */
export async function insertChunked<T>(
  insert: (rows: T[]) => Promise<unknown>,
  rows: T[]
) {
  for (let at = 0; at < rows.length; at += CHUNK) {
    // biome-ignore lint/nursery/noAwaitInLoop: lots séquentiels sur une seule transaction
    await insert(rows.slice(at, at + CHUNK));
  }
}
