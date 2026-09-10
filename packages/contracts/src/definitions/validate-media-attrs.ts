import { safeUrl } from "./safe-url";

export function validateMediaAttrs(
  type: string,
  attrs: Record<string, unknown> = {},
): boolean {
  if (type === "mention") {
    return (
      ["page", "person", "date"].includes(String(attrs.kind)) &&
      typeof attrs.referenceId === "string" &&
      attrs.referenceId.length > 0 &&
      attrs.referenceId.length <= 200 &&
      typeof attrs.label === "string" &&
      attrs.label.length > 0 &&
      attrs.label.length <= 300 &&
      typeof attrs.workspaceId === "string" &&
      attrs.workspaceId.length <= 200 &&
      (attrs.kind !== "date" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(attrs.referenceId) &&
          !Number.isNaN(Date.parse(attrs.referenceId))))
    );
  }
  if (!["image", "file", "bookmark"].includes(type)) return true;
  for (const key of ["caption", "name", "description", "alt", "title"]) {
    const value = attrs[key];
    if (value != null && (typeof value !== "string" || value.length > 2000))
      return false;
  }
  for (const key of ["width", "height"]) {
    const value = attrs[key];
    if (
      value != null &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 1 ||
        value > 10000)
    )
      return false;
  }
  if (
    attrs.size != null &&
    (typeof attrs.size !== "number" ||
      !Number.isSafeInteger(attrs.size) ||
      attrs.size < 0)
  )
    return false;
  if (
    attrs.alignment != null &&
    !["left", "center", "right"].includes(String(attrs.alignment))
  )
    return false;
  const url = attrs[type === "image" ? "src" : "href"];
  return (
    url === undefined ||
    url === "" ||
    (safeUrl(url) && !String(url).startsWith("mailto:"))
  );
}
