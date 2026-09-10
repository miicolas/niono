import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, text: string) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 11025),
    secure: process.env.SMTP_SECURE === "true",
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "DigiPM <hello@digipm.local>",
    to,
    subject,
    text,
  });
}
