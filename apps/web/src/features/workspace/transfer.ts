import { download } from "@/lib/download";
import TurndownService from "turndown";
import { marked } from "marked";
import { documentSchema, safeUrl, type DocumentNode } from "@digipm/contracts";
export async function exportMarkdown(
  title: string,
  html: string,
  _pageId: string,
) {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  const text = `# ${title}\n\n${service.turndown(html)}`;
  download(`${title || "page"}.md`, text, "text/markdown");
}
export function parseImportedPage(
  name: string,
  text: string,
): { title: string; icon: string; content: DocumentNode } {
  if (name.endsWith(".json")) {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || !parsed)
      throw new Error("Document JSON invalide.");
    const input = parsed as Record<string, unknown>;
    return {
      title:
        typeof input.title === "string"
          ? input.title.slice(0, 300)
          : name.replace(/\.json$/, ""),
      icon: typeof input.icon === "string" ? input.icon.slice(0, 50) : "📄",
      content: documentSchema.parse(input.content ?? parsed),
    };
  }
  // HTML is parsed in an inert document and converted through an allowlist; no imported markup is mounted.
  const html = marked.parse(text, { async: false });
  const dom = new DOMParser().parseFromString(
    html.replace(/<(img|iframe|object|embed)\b[^>]*>/gi, ""),
    "text/html",
  );
  function inline(
    node: ChildNode,
    marks: NonNullable<DocumentNode["marks"]> = [],
  ): DocumentNode[] {
    if (node.nodeType === Node.TEXT_NODE)
      return node.textContent
        ? [{ type: "text", text: node.textContent, marks }]
        : [];
    if (!(node instanceof HTMLElement)) return [];
    const tag = node.tagName;
    const types: Record<string, string> = {
      STRONG: "bold",
      B: "bold",
      EM: "italic",
      I: "italic",
      S: "strike",
      DEL: "strike",
      CODE: "code",
      U: "underline",
    };
    if (tag === "BR") return [{ type: "hardBreak" }];
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(tag)) return [];
    let next = marks;
    if (types[tag]) next = [...marks, { type: types[tag]! }];
    if (tag === "A" && safeUrl(node.getAttribute("href") ?? ""))
      next = [
        ...marks,
        { type: "link", attrs: { href: node.getAttribute("href") } },
      ];
    return Array.from(node.childNodes).flatMap((n) => inline(n, next));
  }
  function block(node: ChildNode): DocumentNode[] {
    if (!(node instanceof HTMLElement))
      return node.textContent?.trim()
        ? [{ type: "paragraph", content: inline(node) }]
        : [];
    const tag = node.tagName;
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(tag)) return [];
    if (/^H[1-6]$/.test(tag))
      return [
        {
          type: "heading",
          attrs: { level: Math.min(3, Number(tag[1])) },
          content: Array.from(node.childNodes).flatMap((n) => inline(n)),
        },
      ];
    if (tag === "HR") return [{ type: "horizontalRule" }];
    if (tag === "PRE")
      return [
        {
          type: "codeBlock",
          content: node.textContent
            ? [{ type: "text", text: node.textContent }]
            : [],
        },
      ];
    if (tag === "BLOCKQUOTE")
      return [
        {
          type: "blockquote",
          content: Array.from(node.childNodes).flatMap(block),
        },
      ];
    if (tag === "UL" || tag === "OL")
      return [
        {
          type: tag === "UL" ? "bulletList" : "orderedList",
          content: Array.from(node.children).map((li) => ({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: Array.from(li.childNodes)
                  .filter(
                    (n) =>
                      !(
                        n instanceof HTMLElement &&
                        ["UL", "OL"].includes(n.tagName)
                      ),
                  )
                  .flatMap((n) => inline(n)),
              },
              ...Array.from(li.children)
                .filter((c) => ["UL", "OL"].includes(c.tagName))
                .flatMap(block),
            ],
          })),
        },
      ];
    if (tag === "TABLE")
      return [
        {
          type: "table",
          content: Array.from(node.querySelectorAll("tr")).map((tr) => ({
            type: "tableRow",
            content: Array.from(tr.children).map((td) => ({
              type: td.tagName === "TH" ? "tableHeader" : "tableCell",
              content: [
                {
                  type: "paragraph",
                  content: Array.from(td.childNodes).flatMap((n) => inline(n)),
                },
              ],
            })),
          })),
        },
      ];
    return [
      {
        type: "paragraph",
        content: Array.from(node.childNodes).flatMap((n) => inline(n)),
      },
    ];
  }
  return {
    title: name.replace(/\.(md|markdown|txt)$/i, ""),
    icon: "📄",
    content: documentSchema.parse({
      type: "doc",
      content: Array.from(dom.body.childNodes).flatMap(block),
    }),
  };
}
