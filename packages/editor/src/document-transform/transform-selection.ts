import { Transform } from "@tiptap/pm/transform";
import { documentSchema, type DocumentNode } from "@digipm/contracts";
import type { CodexSelection } from "@digipm/contracts/codex";
import { selectedText } from "./selected-text";
import { schema } from "./shared";

export function transformSelection(
  content: DocumentNode,
  selection: CodexSelection,
  text: string,
  mode: "replace" | "insert",
): DocumentNode {
  selectedText(content, selection);
  const doc = schema.nodeFromJSON(content);
  const tr = new Transform(doc);
  if (mode === "replace")
    tr.replaceWith(selection.from, selection.to, schema.text(text));
  else {
    const position = doc.resolve(selection.to);
    const at = position.depth ? position.after(1) : selection.to;
    tr.insert(
      at,
      schema.nodes.paragraph!.create(
        { id: crypto.randomUUID() },
        schema.text(text),
      ),
    );
  }
  tr.doc.check();
  return documentSchema.parse(tr.doc.toJSON());
}
