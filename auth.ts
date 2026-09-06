import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db, schema } from "@/db";
import { env } from "@/env/server";
import { sendEmail } from "@/server/services/email/send-email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Réinitialiser votre mot de passe DigiPM",
        `Bonjour ${user.name},\n\nChoisissez un nouveau mot de passe : ${url}\n\nSi vous n'avez pas demandé ce changement, ignorez ce message.`
      ),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) =>
      sendEmail(
        user.email,
        "Vérifier votre adresse DigiPM",
        `Vérifiez votre adresse : ${url}`
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
