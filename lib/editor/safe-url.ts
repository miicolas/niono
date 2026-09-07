const ROOT_RELATIVE = /^\/(?!\/)/;
const ALLOWED_PROTOCOLS = ["https:", "http:", "mailto:"];
const LAST_CONTROL_CHAR = 0x20;

function hasControlCharOrBackslash(value: string): boolean {
  for (const char of value) {
    if (char === "\\" || char.charCodeAt(0) <= LAST_CONTROL_CHAR) {
      return true;
    }
  }
  return false;
}

/** Accepte les liens relatifs, les ancres et les URL http(s)/mailto sans caractère de contrôle. */
export function safeUrl(value: unknown): boolean {
  if (typeof value !== "string" || hasControlCharOrBackslash(value)) {
    return false;
  }
  if (ROOT_RELATIVE.test(value) || value.startsWith("#")) {
    return true;
  }
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
