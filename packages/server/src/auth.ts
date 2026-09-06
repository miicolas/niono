import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@digipm/db";
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
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Réinitialiser votre mot de passe DigiPM",
        `Bonjour ${user.name},\n\nChoisissez un nouveau mot de passe : ${url}\n\nSi vous n'avez pas demandé ce changement, ignorez ce message.`,
      ),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Vérifier votre adresse DigiPM",
        `Vérifiez votre adresse : ${url}`,
      ),
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
});
