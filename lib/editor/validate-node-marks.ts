import { markTypes } from "./document-node";
import { safeUrl } from "./safe-url";

function validateMark(mark: unknown): boolean {
  if (!mark || typeof mark !== "object") {
    return false;
  }
  const { type, attrs } = mark as { type?: unknown; attrs?: unknown };
  if (typeof type !== "string" || !markTypes.has(type)) {
    return false;
  }
  if (attrs === undefined) {
    return true;
  }
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) {
    return false;
  }
  const href = (attrs as Record<string, unknown>).href;
  return href === undefined || safeUrl(href);
}

/** Valide la liste de marques d'un nœud : types connus et liens sûrs. */
export function validateNodeMarks(marks: unknown): boolean {
  if (marks === undefined) {
    return true;
  }
  return Array.isArray(marks) && marks.every(validateMark);
}
