import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export function command(): { executable: string; args: string[] } {
  if (process.env.CODEX_BIN)
    return { executable: process.env.CODEX_BIN, args: [] };
  const require = createRequire(import.meta.url);
  const file = require.resolve("@openai/codex/package.json");
  return {
    executable: process.execPath,
    args: [join(dirname(file), "bin/codex.js")],
  };
}
