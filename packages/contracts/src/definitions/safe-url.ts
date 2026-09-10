export function safeUrl(value: unknown): boolean {
  if (typeof value !== "string" || /[\\\x00-\x20]/.test(value)) return false;
  if (/^\/(?!\/)/.test(value) || value.startsWith("#")) return true;
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
