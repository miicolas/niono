import { validateMediaAttrs } from "./validate-media-attrs";
import { questionnaireSchema } from "../questionnaire";
import { type DocumentNode } from "./document-node";
import { nodeTypes } from "./node-types";
import { safeUrl } from "./safe-url";
import { markTypes } from "./mark-types";

export function validateDocument(value: unknown): value is DocumentNode {
  let count = 0;
  const inline = new Set(["text", "hardBreak", "mention"]);
  const blocks = new Set([
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
    "bookmark",
    "questionnaire",
  ]);
  function visit(n: unknown, depth: number): boolean {
    if (
      !n ||
      typeof n !== "object" ||
      Array.isArray(n) ||
      depth > 30 ||
      ++count > 15000
    )
      return false;
    const node = n as Record<string, unknown>;
    const type = node.type;
    if (
      typeof type !== "string" ||
      !nodeTypes.has(type) ||
      (type === "doc" && depth !== 0)
    )
      return false;
    if (
      type === "text"
        ? typeof node.text !== "string" || !node.text.length
        : node.text !== undefined
    )
      return false;
    const attrs = node.attrs;
    if (attrs !== undefined) {
      if (!attrs || typeof attrs !== "object" || Array.isArray(attrs))
        return false;
      const a = attrs as Record<string, unknown>;
      if (
        (a.src !== undefined &&
          !(type === "image" && a.src === "") &&
          !safeUrl(a.src)) ||
        (a.href !== undefined &&
          !(["file", "bookmark"].includes(type) && a.href === "") &&
          !safeUrl(a.href))
      )
        return false;
      if (
        a.id !== undefined &&
        a.id !== null &&
        (typeof a.id !== "string" || a.id.length > 100)
      )
        return false;
      if (a.level !== undefined && ![1, 2, 3].includes(a.level as number))
        return false;
      if (a.checked !== undefined && typeof a.checked !== "boolean")
        return false;
      if (
        a.textAlign !== undefined &&
        a.textAlign !== null &&
        !["left", "center", "right", "justify"].includes(a.textAlign as string)
      )
        return false;
    }
    if (!validateMediaAttrs(type, attrs as Record<string, unknown> | undefined))
      return false;
    if (
      type === "questionnaire" &&
      !questionnaireSchema.safeParse(
        (attrs as Record<string, unknown> | undefined)?.questionnaire,
      ).success
    )
      return false;
    if (node.marks !== undefined) {
      if (
        !Array.isArray(node.marks) ||
        !node.marks.every((m) => {
          if (!m || typeof m !== "object" || !markTypes.has(m.type))
            return false;
          if (
            m.attrs !== undefined &&
            (!m.attrs || typeof m.attrs !== "object" || Array.isArray(m.attrs))
          )
            return false;
          return m.attrs?.href === undefined || safeUrl(m.attrs.href);
        })
      )
        return false;
    }
    if (node.content !== undefined && !Array.isArray(node.content))
      return false;
    const children = (node.content ?? []) as DocumentNode[];
    if (!children.every((c) => visit(c, depth + 1))) return false;
    if (
      [
        "text",
        "hardBreak",
        "horizontalRule",
        "image",
        "file",
        "bookmark",
        "mention",
        "questionnaire",
        "pageLink",
      ].includes(type)
    )
      return children.length === 0;
    if (["paragraph", "heading", "detailsSummary"].includes(type))
      return children.every((c) => inline.has(c.type));
    if (type === "codeBlock")
      return children.every((c) => c.type === "text" && !c.marks?.length);
    if (type === "bulletList" || type === "orderedList")
      return (
        children.length > 0 && children.every((c) => c.type === "listItem")
      );
    if (type === "taskList")
      return (
        children.length > 0 && children.every((c) => c.type === "taskItem")
      );
    if (type === "listItem" || type === "taskItem")
      return (
        children[0]?.type === "paragraph" &&
        children.every((c) => blocks.has(c.type))
      );
    if (type === "table")
      return (
        children.length > 0 && children.every((c) => c.type === "tableRow")
      );
    if (type === "tableRow")
      return (
        children.length > 0 &&
        children.every(
          (c) => c.type === "tableCell" || c.type === "tableHeader",
        )
      );
    if (type === "details")
      return (
        children.length === 2 &&
        children[0]?.type === "detailsSummary" &&
        children[1]?.type === "detailsContent"
      );
    return children.length > 0 && children.every((c) => blocks.has(c.type));
  }
  try {
    return (
      visit(value, 0) &&
      (value as DocumentNode).type === "doc" &&
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
        2 * 1024 * 1024
    );
  } catch {
    return false;
  }
}
