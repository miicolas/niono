import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { EmailTransport } from "./email-transport";

/** Transport de développement : chaque email est écrit en JSON dans un dossier local. */
export function createOutboxTransport(
  dir: string,
  from: string,
): EmailTransport {
  const root = resolve(dir);
  return {
    async send(message) {
      await mkdir(root, { recursive: true });
      const file = join(
        root,
        `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.json`,
      );
      await writeFile(
        file,
        JSON.stringify(
          { from, ...message, sentAt: new Date().toISOString() },
          null,
          2,
        ),
      );
      console.info(`[email] ${message.subject} → ${message.to} (${file})`);
    },
  };
}
