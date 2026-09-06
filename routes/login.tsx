import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthScreen } from "@/features/auth/auth-screen";
export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    invite: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional()
      .catch(undefined),
  }),
  component: () => <AuthScreen invite={Route.useSearch().invite} />,
});
