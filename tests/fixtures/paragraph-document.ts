import type { DocumentNode } from "../../packages/contracts/src";
export function paragraphDocument(text: string): DocumentNode {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}
