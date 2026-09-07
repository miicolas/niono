import { ORPCError } from "@orpc/server";
import { db } from "@/db";
import { accessPage } from "@/server/services/access/access-page";
import { rewriteText } from "./rewrite-text";

/** Réécrit un extrait d'une page modifiable par l'utilisateur via le fournisseur IA configuré. */
export async function rewritePageText(
  userId: string,
  input: { pageId: string; text: string; instruction: string }
) {
  await accessPage(db, userId, input.pageId, true);
  const text = await rewriteText(input).catch(() => {
    throw new ORPCError("BAD_GATEWAY", {
      message: "Le fournisseur IA n’a pas répondu correctement.",
    });
  });
  if (text === undefined) {
    throw new ORPCError("PRECONDITION_FAILED", {
      message:
        "Configurez AI_MODEL (et AI_GATEWAY_API_KEY ou AI_BASE_URL) côté serveur pour activer l’assistant.",
    });
  }
  return { text };
}
