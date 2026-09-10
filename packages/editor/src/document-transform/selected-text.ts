import { documentSchema, type DocumentNode } from "@digipm/contracts";
import type { CodexSelection } from "@digipm/contracts/codex";
import { schema } from "./shared";

export function selectedText(content: DocumentNode, selection: CodexSelection) {
  const doc = schema.nodeFromJSON(documentSchema.parse(content));
  doc.check();
  if (selection.from < 0 || selection.to > doc.content.size)
    throw new Error("La sélection a changé. Relancez la demande.");
  const text = doc.textBetween(selection.from, selection.to, "\n");
  if (text !== selection.text)
    throw new Error("La sélection a changé. Relancez la demande.");
  return text;
}
