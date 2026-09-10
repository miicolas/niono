import { betterAuth } from "better-auth";
import { randomUUID } from "node:crypto";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema, type Transaction } from "@digipm/db";
import { organizationAccess, organizationRoles } from "../permissions";
import { initializeWorkspaceContent } from "../workspace-content";
import { sendEmail } from "./send-email";

export function createAuth(connection: typeof db | Transaction = db) {
  return betterAuth({
    database: drizzleAdapter(connection, {
      provider: "pg",
      schema,
      transaction: true,
    }),
    // The existing user/session IDs are text; let Better Auth supply UUIDs instead of expecting SQL defaults.
    advanced: { database: { generateId: () => randomUUID() } },
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
    plugins: [
      organization({
        ac: organizationAccess,
        roles: organizationRoles,
        teams: {
          enabled: true,
          defaultTeam: { enabled: false },
          allowRemovingAllTeams: true,
        },
        requireEmailVerificationOnInvitation: true,
        invitationExpiresIn: 7 * 24 * 60 * 60,
        schema: {
          organization: {
            additionalFields: {
              icon: { type: "string", defaultValue: "D", required: false },
            },
          },
        },
        sendInvitationEmail: async ({
          id,
          email,
          organization: workspace,
          inviter,
        }) => {
          const url = new URL(
            "/invite",
            process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
          );
          url.searchParams.set("invitationId", id);
          await sendEmail(
            email,
            "Votre invitation DigiPM",
            `${inviter.user.name} vous invite dans l’espace ${workspace.name}. Connectez-vous ou inscrivez-vous avec cette adresse, puis ouvrez ce lien :\n${url}`,
          );
        },
        organizationHooks: {
          afterCreateOrganization: async ({ organization: workspace, user }) =>
            initializeWorkspaceContent(connection, workspace.id, user.id),
        },
      }),
    ],
  });
}
