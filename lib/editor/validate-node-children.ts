import {
  blockNodeTypes,
  type DocumentNode,
  inlineNodeTypes,
} from "./document-node";

const LEAF_TYPES = new Set([
  "text",
  "hardBreak",
  "horizontalRule",
  "image",
  "file",
  "pageLink",
]);
const INLINE_CONTAINERS = new Set(["paragraph", "heading", "detailsSummary"]);

function everyChildOfType(children: DocumentNode[], type: string) {
  return children.length > 0 && children.every((c) => c.type === type);
}

/** Vérifie la structure des enfants selon le type du nœud parent. */
export function validateNodeChildren(
  type: string,
  children: DocumentNode[]
): boolean {
  if (LEAF_TYPES.has(type)) {
    return children.length === 0;
  }
  if (INLINE_CONTAINERS.has(type)) {
    return children.every((c) => inlineNodeTypes.has(c.type));
  }
  if (type === "codeBlock") {
    return children.every((c) => c.type === "text" && !c.marks?.length);
  }
  if (type === "bulletList" || type === "orderedList") {
    return everyChildOfType(children, "listItem");
  }
  if (type === "taskList") {
    return everyChildOfType(children, "taskItem");
  }
  if (type === "listItem" || type === "taskItem") {
    return (
      children[0]?.type === "paragraph" &&
      children.every((c) => blockNodeTypes.has(c.type))
    );
  }
  if (type === "table") {
    return everyChildOfType(children, "tableRow");
  }
  if (type === "tableRow") {
    return (
      children.length > 0 &&
      children.every((c) => c.type === "tableCell" || c.type === "tableHeader")
    );
  }
  if (type === "details") {
    return (
      children.length === 2 &&
      children[0]?.type === "detailsSummary" &&
      children[1]?.type === "detailsContent"
    );
  }
  return (
    children.length > 0 && children.every((c) => blockNodeTypes.has(c.type))
  );
}
