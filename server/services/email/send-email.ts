import type { ReactElement } from "react";
import { env } from "@/env/server";
import type { EmailTransport } from "./email-transport";
import { createOutboxTransport } from "./outbox-transport";
import { renderEmail } from "./render-email";
import { createResendTransport } from "./resend-transport";

let transport: EmailTransport | undefined;

function selectTransport(): EmailTransport {
  const from = env.EMAIL_FROM;
  if (env.RESEND_API_KEY) {
    return createResendTransport(env.RESEND_API_KEY, from);
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY est requis en production pour envoyer les emails."
    );
  }
  return createOutboxTransport(env.EMAIL_OUTBOX_DIR, from);
}

/** Envoie un email texte (et HTML optionnel) via Resend, ou l'outbox locale en développement. */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  transport ??= selectTransport();
  await transport.send({ to, subject, text, html });
}

/** Rend un template React Email puis l'envoie avec sa version texte. */
export async function sendTemplateEmail(
  to: string,
  subject: string,
  template: ReactElement
) {
  const { html, text } = await renderEmail(template);
  await sendEmail(to, subject, text, html);
}
