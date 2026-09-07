import { expect, test } from "bun:test";

const JSON_FILE = /\.json$/;
const RESEND_REFUSED = /Resend a refusé l’envoi/;

import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("l’outbox locale écrit chaque email en JSON avec l’expéditeur", async () => {
  const dir = await mkdtemp(join(tmpdir(), "digipm-outbox-"));
  const { createOutboxTransport } = await import(
    "@/server/services/email/outbox-transport"
  );
  const transport = createOutboxTransport(dir, "Test <test@digipm.local>");
  await transport.send({
    to: "dest@example.test",
    subject: "Sujet",
    text: "Corps https://example.test/x",
  });
  const [file] = await readdir(dir);
  expect(file).toMatch(JSON_FILE);
  expect(
    JSON.parse(await readFile(join(dir, file ?? ""), "utf8"))
  ).toMatchObject({
    from: "Test <test@digipm.local>",
    to: "dest@example.test",
    subject: "Sujet",
    text: "Corps https://example.test/x",
  });
});

test("le transport Resend remonte l’erreur renvoyée par l’API", async () => {
  const { createResendTransport } = await import(
    "@/server/services/email/resend-transport"
  );
  const transport = createResendTransport("re_invalid", "Test <t@x.test>");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        name: "validation_error",
        message: "Domaine non vérifié",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )) as unknown as typeof fetch;
  try {
    await expect(
      transport.send({ to: "a@b.test", subject: "s", text: "t" })
    ).rejects.toThrow(RESEND_REFUSED);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
