import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db, schema } from "@/db";
import ResetPasswordEmail, {
  resetPasswordSubject,
} from "@/emails/reset-password";
import VerifyEmail, { verifyEmailSubject } from "@/emails/verify-email";
import { env } from "@/env/server";
import { sendTemplateEmail } from "@/server/services/email/send-email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) =>
      sendTemplateEmail(
        user.email,
        resetPasswordSubject,
        ResetPasswordEmail({ name: user.name, url })
      ),
  },
  emailVerification: {
    sendVerificationEmail: ({ user, url }) =>
      sendTemplateEmail(user.email, verifyEmailSubject, VerifyEmail({ url })),
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
