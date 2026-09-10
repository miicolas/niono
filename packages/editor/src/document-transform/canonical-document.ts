import { documentSchema, type DocumentNode } from "@digipm/contracts";
import { schema, blockIdTypes } from "./shared";

export function canonicalDocument(content: DocumentNode): DocumentNode {
  const doc = schema.nodeFromJSON(documentSchema.parse(content));
  doc.check();
  const ids = new Set<string>();
  const visit = (node: DocumentNode): DocumentNode => {
    if (blockIdTypes.includes(node.type)) {
      const previous = node.attrs?.id;
      const id =
        typeof previous === "string" && previous && !ids.has(previous)
          ? previous
          : crypto.randomUUID();
      ids.add(id);
      node = { ...node, attrs: { ...node.attrs, id } };
    }
    return {
      ...node,
      ...(node.content ? { content: node.content.map(visit) } : {}),
    };
  };
  return documentSchema.parse(visit(doc.toJSON()));
}
