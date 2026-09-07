import { createFileRoute, redirect } from "@tanstack/react-router";
import { PAGES } from "@/constants/pages";
import { signInSearchSchema } from "@/validators/auth";

/** Ancien chemin de connexion conservé une version pour les liens et favoris existants. */
export const Route = createFileRoute("/(auth)/login")({
  validateSearch: signInSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: PAGES.SIGN_IN, search, replace: true });
  },
});
