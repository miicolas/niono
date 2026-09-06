import { env } from "@/env/server";
import type { EmailTransport } from "./email-transport";
import { createOutboxTransport } from "./outbox-transport";
import { createResendTransport } from "./resend-transport";

let transport: EmailTransport | undefined;

function selectTransport(): EmailTransport {
  const from = env.EMAIL_FROM;
  const apiKey = env.RESEND_API_KEY;
  if (apiKey) {
    return createResendTransport(apiKey, from);
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY est requis en production pour envoyer les emails."
    );
  }
  return createOutboxTransport(env.EMAIL_OUTBOX_DIR, from);
}

export async function sendEmail(to: string, subject: string, text: string) {
  transport ??= selectTransport();
  await transport.send({ to, subject, text });
}
