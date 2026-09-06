import type { EmailTransport } from "./email-transport";
import { createResendTransport } from "./resend-transport";
import { createOutboxTransport } from "./outbox-transport";

let transport: EmailTransport | undefined;

function selectTransport(): EmailTransport {
  const from = process.env.EMAIL_FROM ?? "DigiPM <hello@digipm.local>";
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) return createResendTransport(apiKey, from);
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "RESEND_API_KEY est requis en production pour envoyer les emails.",
    );
  return createOutboxTransport(
    process.env.EMAIL_OUTBOX_DIR ?? ".data/outbox",
    from,
  );
}

export async function sendEmail(to: string, subject: string, text: string) {
  transport ??= selectTransport();
  await transport.send({ to, subject, text });
}
