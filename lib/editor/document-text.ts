import type { DocumentNode } from "./document-node";

/** Texte brut d'un document, une ligne par bloc de premier niveau. */
export function documentText(node: DocumentNode): string {
  return (
    node.text ??
    node.content?.map(documentText).join(node.type === "doc" ? "\n" : " ") ??
    ""
  );
}
