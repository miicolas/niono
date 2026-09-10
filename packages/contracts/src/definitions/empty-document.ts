import { type DocumentNode } from "./document-node";

export const emptyDocument: DocumentNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
