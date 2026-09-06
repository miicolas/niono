import { z } from "zod";

export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocumentNode[];
};
const nodeTypes = new Set([
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
const markTypes = new Set([
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
export function safeUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (/^\/(?!\/)/.test(value) || value.startsWith("#")) return true;
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function validateDocument(value: unknown): value is DocumentNode {
  let count = 0;
  const inline = new Set(["text", "hardBreak"]);
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
        (a.src !== undefined && !safeUrl(a.src)) ||
        (a.href !== undefined && !safeUrl(a.href))
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
export const documentSchema = z.custom<DocumentNode>(
  validateDocument,
  "Document invalide ou trop volumineux",
);
export const emptyDocument: DocumentNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
export function documentText(node: DocumentNode): string {
  return (
    node.text ??
    node.content?.map(documentText).join(node.type === "doc" ? "\n" : " ") ??
    ""
  );
}
export const idSchema = z.uuid();
export const roleSchema = z.enum(["owner", "editor", "viewer"]);
export const propertyTypeSchema = z.enum([
  "text",
  "number",
  "checkbox",
  "select",
  "multiSelect",
  "status",
  "date",
  "person",
  "url",
  "email",
  "files",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const propertyOptionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  color: z.string().max(30),
});
export type PropertyOption = z.infer<typeof propertyOptionSchema>;
export const propertyValueSchema = z.union([
  z.string().max(10000),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(300)).max(100),
  z.null(),
]);
export type PropertyValue = z.infer<typeof propertyValueSchema>;
export const viewSchema = z.object({
  layout: z
    .enum(["table", "board", "list", "gallery", "calendar"])
    .default("table"),
  sortBy: z.string().max(100).default("position"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  groupBy: z.string().max(100).optional(),
  hidden: z.array(z.string().max(100)).max(100).default([]),
  filters: z
    .array(
      z.object({
        propertyId: z.string(),
        operator: z.enum(["contains", "eq", "neq", "gt", "lt", "empty"]),
        value: z.string().max(300),
      }),
    )
    .max(20)
    .default([]),
  filterMode: z.enum(["and", "or"]).default("and"),
});
export type ViewConfig = z.infer<typeof viewSchema>;
export function validatePropertyValue(
  type: PropertyType,
  value: PropertyValue,
  options: PropertyOption[] = [],
): boolean {
  if (value === null) return true;
  if (type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (type === "checkbox") return typeof value === "boolean";
  if (type === "multiSelect")
    return (
      Array.isArray(value) &&
      value.every((v) => options.some((o) => o.id === v))
    );
  if (type === "files" || type === "person") return Array.isArray(value);
  if (type === "select" || type === "status")
    return typeof value === "string" && options.some((o) => o.id === value);
  if (type === "date")
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    );
  if (type === "url") return safeUrl(value);
  if (type === "email") return z.email().safeParse(value).success;
  return typeof value === "string";
}
