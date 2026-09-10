import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import {
  organizationAccess,
  organizationRoles,
} from "@digipm/server/permissions";
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac: organizationAccess,
      roles: organizationRoles,
      teams: { enabled: true },
    }),
  ],
});

export function authResult<T>(result: {
  data: T;
  error: { message?: string } | null;
}) {
  if (result.error)
    throw new Error(result.error.message ?? "Cette action est indisponible.");
  if (!result.data) throw new Error("Aucune réponse reçue.");
  return result.data;
}
