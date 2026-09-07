import { createFileRoute } from "@tanstack/react-router";
import { resetPasswordSearchSchema } from "@/validators/auth";
import { ResetPasswordForm } from "./-components/reset-password-form";

export const Route = createFileRoute("/(auth)/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  head: () => ({ meta: [{ title: "Nouveau mot de passe — DigiPM" }] }),
  component: () => <ResetPasswordForm token={Route.useSearch().token} />,
});
