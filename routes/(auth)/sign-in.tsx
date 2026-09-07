import { createFileRoute } from "@tanstack/react-router";
import { signInSearchSchema } from "@/validators/auth";
import { SignInForm } from "./-components/sign-in-form";

export const Route = createFileRoute("/(auth)/sign-in")({
  validateSearch: signInSearchSchema,
  head: () => ({ meta: [{ title: "Connexion — DigiPM" }] }),
  component: () => <SignInForm invite={Route.useSearch().invite} />,
});
