import type { DocumentNode } from "./document-node";

export function remapDocumentMentions(
  node: DocumentNode,
  pages: ReadonlyMap<string, string>,
  workspaceId?: string,
): DocumentNode {
  const referenceId = node.attrs?.referenceId;
  const mapped =
    node.type === "mention" &&
    node.attrs?.kind === "page" &&
    typeof referenceId === "string"
      ? pages.get(referenceId)
      : undefined;
  return {
    ...node,
    ...(mapped
      ? {
          attrs: {
            ...node.attrs,
            referenceId: mapped,
            ...(workspaceId ? { workspaceId } : {}),
          },
        }
      : {}),
    ...(node.content
      ? {
          content: node.content.map((child) =>
            remapDocumentMentions(child, pages, workspaceId),
          ),
        }
      : {}),
  };
}
