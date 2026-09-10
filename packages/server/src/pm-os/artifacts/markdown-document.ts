import { marked } from "marked";
import { documentSchema, type DocumentNode } from "@digipm/contracts";
import { canonicalDocument } from "@digipm/editor/document-transform";
export function markdownDocument(markdown: string): DocumentNode {
  type Token = {
    type: string;
    text?: string;
    tokens?: Token[];
    depth?: number;
    lang?: string;
    href?: string;
    ordered?: boolean;
    start?: number;
    items?: { tokens: Token[]; task?: boolean; checked?: boolean }[];
    header?: { tokens: Token[] }[];
    rows?: { tokens: Token[] }[][];
  };
  const text = (
    value: string,
    marks?: DocumentNode["marks"],
  ): DocumentNode[] =>
    value
      ? [{ type: "text", text: value, ...(marks?.length ? { marks } : {}) }]
      : [];
  const inline = (
    tokens: Token[],
    marks: NonNullable<DocumentNode["marks"]> = [],
  ): DocumentNode[] =>
    tokens.flatMap((token): DocumentNode[] => {
      if (token.type === "br") return [{ type: "hardBreak" }];
      if (
        token.type === "strong" ||
        token.type === "em" ||
        token.type === "del"
      )
        return inline(token.tokens ?? [], [
          ...marks,
          {
            type:
              token.type === "strong"
                ? "bold"
                : token.type === "em"
                  ? "italic"
                  : "strike",
          },
        ]);
      if (token.type === "codespan")
        return text(token.text ?? "", [...marks, { type: "code" }]);
      if (
        token.type === "link" &&
        /^(https?:|mailto:|\/)/.test(token.href ?? "")
      )
        return inline(token.tokens ?? [], [
          ...marks,
          {
            type: "link",
            attrs: {
              href: token.href,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
        ]);
      return token.tokens
        ? inline(token.tokens, marks)
        : text(token.text ?? "", marks);
    });
  const blocks = (tokens: Token[]): DocumentNode[] =>
    tokens.flatMap((token): DocumentNode[] => {
      if (token.type === "space") return [];
      if (token.type === "heading")
        return [
          {
            type: "heading",
            attrs: { level: Math.min(3, token.depth ?? 1) },
            content: inline(token.tokens ?? []),
          },
        ];
      if (token.type === "code")
        return [
          {
            type: "codeBlock",
            attrs: { language: token.lang ?? null },
            content: text(token.text ?? ""),
          },
        ];
      if (token.type === "hr") return [{ type: "horizontalRule" }];
      if (token.type === "blockquote")
        return [{ type: "blockquote", content: blocks(token.tokens ?? []) }];
      if (token.type === "list") {
        const task = token.items?.every((item) => item.task);
        return [
          {
            type: task
              ? "taskList"
              : token.ordered
                ? "orderedList"
                : "bulletList",
            ...(token.ordered ? { attrs: { start: token.start ?? 1 } } : {}),
            content: (token.items ?? []).map((item) => ({
              type: task ? "taskItem" : "listItem",
              ...(task ? { attrs: { checked: !!item.checked } } : {}),
              content: blocks(item.tokens),
            })),
          },
        ];
      }
      if (token.type === "table")
        return [
          {
            type: "table",
            content: [token.header ?? [], ...(token.rows ?? [])].map(
              (row, index) => ({
                type: "tableRow",
                content: row.map((cell) => ({
                  type: index === 0 ? "tableHeader" : "tableCell",
                  attrs: { colspan: 1, rowspan: 1, colwidth: null },
                  content: [
                    { type: "paragraph", content: inline(cell.tokens) },
                  ],
                })),
              }),
            ),
          },
        ];
      return [
        {
          type: "paragraph",
          content: token.tokens ? inline(token.tokens) : text(token.text ?? ""),
        },
      ];
    });
  const content = blocks(marked.lexer(markdown) as Token[]);
  return canonicalDocument(
    documentSchema.parse({
      type: "doc",
      content: content.length ? content : [{ type: "paragraph" }],
    }),
  );
}
