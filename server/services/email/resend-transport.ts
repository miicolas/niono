import { Resend } from "resend";
import type { EmailTransport } from "./email-transport";

export function createResendTransport(
  apiKey: string,
  from: string
): EmailTransport {
  const resend = new Resend(apiKey);
  return {
    async send(message) {
      const { error } = await resend.emails.send({ from, ...message });
      if (error) {
        throw new Error(
          `Resend a refusé l’envoi : ${error.name} ${error.message}`
        );
      }
    },
  };
}
