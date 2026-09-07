/** Nœud Tiptap/ProseMirror sérialisé en JSON tel qu'il est stocké et échangé. */
export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocumentNode[];
};

export const nodeTypes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "horizontalRule",
  "hardBreak",
  "codeBlock",
  "image",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
  "details",
  "detailsSummary",
  "detailsContent",
  "callout",
  "pageLink",
  "file",
]);

export const markTypes = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "textStyle",
  "highlight",
  "subscript",
  "superscript",
]);

export const inlineNodeTypes = new Set(["text", "hardBreak"]);

export const blockNodeTypes = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "horizontalRule",
  "codeBlock",
  "image",
  "table",
  "details",
  "callout",
  "pageLink",
  "file",
]);
