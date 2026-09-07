import { type DocumentNode, nodeTypes } from "./document-node";
import { validateNodeAttrs } from "./validate-node-attrs";
import { validateNodeChildren } from "./validate-node-children";
import { validateNodeMarks } from "./validate-node-marks";

export const MAX_DOCUMENT_DEPTH = 30;
export const MAX_DOCUMENT_NODES = 15_000;
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

function validateText(type: string, text: unknown): boolean {
  if (type === "text") {
    return typeof text === "string" && text.length > 0;
  }
  return text === undefined;
}

/**
 * Valide un document Tiptap sérialisé : types de nœuds et de marques connus,
 * attributs sûrs, structure des enfants, profondeur, nombre de nœuds et taille bornés.
 */
export function validateDocument(value: unknown): value is DocumentNode {
  let count = 0;
  function visit(candidate: unknown, depth: number): boolean {
    count += 1;
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate) ||
      depth > MAX_DOCUMENT_DEPTH ||
      count > MAX_DOCUMENT_NODES
    ) {
      return false;
    }
    const node = candidate as Record<string, unknown>;
    const type = node.type;
    if (
      typeof type !== "string" ||
      !nodeTypes.has(type) ||
      (type === "doc" && depth !== 0) ||
      !validateText(type, node.text) ||
      !validateNodeAttrs(node.attrs) ||
      !validateNodeMarks(node.marks)
    ) {
      return false;
    }
    if (node.content !== undefined && !Array.isArray(node.content)) {
      return false;
    }
    const children = (node.content ?? []) as DocumentNode[];
    if (!children.every((child) => visit(child, depth + 1))) {
      return false;
    }
    return validateNodeChildren(type, children);
  }
  try {
    return (
      visit(value, 0) &&
      (value as DocumentNode).type === "doc" &&
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
        MAX_DOCUMENT_BYTES
    );
  } catch {
    return false;
  }
}
