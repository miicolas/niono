import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthScreen } from "@/features/auth/auth-screen";
export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    invite: z.string().min(1).max(200).optional().catch(undefined),
  }),
  component: () => <AuthScreen invite={Route.useSearch().invite} />,
});
