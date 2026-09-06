import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordScreen } from "@/features/auth/auth-screen";
export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: () => {
    const { token } = Route.useSearch();
    return <ResetPasswordScreen token={token} />;
  },
});
