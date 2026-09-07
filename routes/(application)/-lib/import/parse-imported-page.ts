import { marked } from "marked";
import type { DocumentNode } from "@/lib/editor/document-node";
import { safeUrl } from "@/lib/editor/safe-url";
import { documentSchema } from "@/validators/documents";

const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT"]);
const LIST_TAGS = ["UL", "OL"];
const HEADING_TAG = /^H[1-6]$/;
const EMBEDDED_TAGS = /<(img|iframe|object|embed)\b[^>]*>/gi;
const JSON_EXTENSION = /\.json$/;
const TEXT_EXTENSION = /\.(md|markdown|txt)$/i;
const MARK_TYPES: Record<string, string> = {
  STRONG: "bold",
  B: "bold",
  EM: "italic",
  I: "italic",
  S: "strike",
  DEL: "strike",
  CODE: "code",
  U: "underline",
};
type Marks = NonNullable<DocumentNode["marks"]>;
function inline(node: ChildNode, marks: Marks = []): DocumentNode[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
      ? [{ type: "text", text: node.textContent, marks }]
      : [];
  }
  if (!(node instanceof HTMLElement)) {
    return [];
  }
  const tag = node.tagName;
  if (tag === "BR") {
    return [{ type: "hardBreak" }];
  }
  if (SKIPPED_TAGS.has(tag)) {
    return [];
  }
  let next = marks;
  const markType = MARK_TYPES[tag];
  if (markType) {
    next = [...marks, { type: markType }];
  }
  if (tag === "A" && safeUrl(node.getAttribute("href") ?? "")) {
    next = [
      ...marks,
      { type: "link", attrs: { href: node.getAttribute("href") } },
    ];
  }
  return Array.from(node.childNodes).flatMap((n) => inline(n, next));
}
const inlineChildren = (node: Node) =>
  Array.from(node.childNodes).flatMap((n) => inline(n));
const isList = (n: Node) =>
  n instanceof HTMLElement && LIST_TAGS.includes(n.tagName);
function listBlock(node: HTMLElement): DocumentNode {
  return {
    type: node.tagName === "UL" ? "bulletList" : "orderedList",
    content: Array.from(node.children).map((li) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: Array.from(li.childNodes)
            .filter((n) => !isList(n))
            .flatMap((n) => inline(n)),
        },
        ...Array.from(li.children).filter(isList).flatMap(block),
      ],
    })),
  };
}
function tableBlock(node: HTMLElement): DocumentNode {
  return {
    type: "table",
    content: Array.from(node.querySelectorAll("tr")).map((tr) => ({
      type: "tableRow",
      content: Array.from(tr.children).map((td) => ({
        type: td.tagName === "TH" ? "tableHeader" : "tableCell",
        content: [{ type: "paragraph", content: inlineChildren(td) }],
      })),
    })),
  };
}
function block(node: ChildNode): DocumentNode[] {
  if (!(node instanceof HTMLElement)) {
    return node.textContent?.trim()
      ? [{ type: "paragraph", content: inline(node) }]
      : [];
  }
  const tag = node.tagName;
  if (SKIPPED_TAGS.has(tag)) {
    return [];
  }
  if (HEADING_TAG.test(tag)) {
    return [
      {
        type: "heading",
        attrs: { level: Math.min(3, Number(tag[1])) },
        content: inlineChildren(node),
      },
    ];
  }
  if (tag === "HR") {
    return [{ type: "horizontalRule" }];
  }
  if (tag === "PRE") {
    return [
      {
        type: "codeBlock",
        content: node.textContent
          ? [{ type: "text", text: node.textContent }]
          : [],
      },
    ];
  }
  if (tag === "BLOCKQUOTE") {
    return [
      {
        type: "blockquote",
        content: Array.from(node.childNodes).flatMap(block),
      },
    ];
  }
  if (LIST_TAGS.includes(tag)) {
    return [listBlock(node)];
  }
  if (tag === "TABLE") {
    return [tableBlock(node)];
  }
  return [{ type: "paragraph", content: inlineChildren(node) }];
}
function parseJsonPage(name: string, text: string) {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || !parsed) {
    throw new Error("Document JSON invalide.");
  }
  const input = parsed as Record<string, unknown>;
  return {
    title:
      typeof input.title === "string"
        ? input.title.slice(0, 300)
        : name.replace(JSON_EXTENSION, ""),
    icon: typeof input.icon === "string" ? input.icon.slice(0, 50) : "📄",
    content: documentSchema.parse(input.content ?? parsed),
  };
}
export function parseImportedPage(
  name: string,
  text: string
): { title: string; icon: string; content: DocumentNode } {
  if (name.endsWith(".json")) {
    return parseJsonPage(name, text);
  }
  // HTML is parsed in an inert document and converted through an allowlist; no imported markup is mounted.
  const html = marked.parse(text, { async: false });
  const dom = new DOMParser().parseFromString(
    html.replace(EMBEDDED_TAGS, ""),
    "text/html"
  );
  return {
    title: name.replace(TEXT_EXTENSION, ""),
    icon: "📄",
    content: documentSchema.parse({
      type: "doc",
      content: Array.from(dom.body.childNodes).flatMap(block),
    }),
  };
}
