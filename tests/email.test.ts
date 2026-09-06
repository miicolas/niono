import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

test("sans clé Resend, sendEmail écrit l’email dans la boîte d’envoi locale", async () => {
  const dir = await mkdtemp(join(tmpdir(), "digipm-outbox-"));
  delete process.env.RESEND_API_KEY;
  process.env.EMAIL_OUTBOX_DIR = dir;
  process.env.EMAIL_FROM = "Test <test@digipm.local>";
  const { sendEmail } = await import("@/server/services/email/send-email");
  await sendEmail("dest@example.test", "Sujet", "Corps https://example.test/x");
  const [file] = await readdir(dir);
  expect(file).toMatch(/\.json$/);
  expect(JSON.parse(await readFile(join(dir, file!), "utf8"))).toMatchObject({
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
    ).rejects.toThrow(/Resend a refusé l’envoi/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
