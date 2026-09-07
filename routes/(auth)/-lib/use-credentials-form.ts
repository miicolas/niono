import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PAGES } from "@/constants/pages";
import { authClient } from "@/lib/auth/client";
import { type Credentials, credentialsSchema } from "@/validators/auth";
import type { AuthMode } from "./auth-mode";

function fallbackName(values: Credentials) {
  return values.name?.trim() || values.email.split("@")[0] || values.email;
}

/** Formulaire connexion / inscription : soumission Better Auth puis redirection (invitation ou accueil). */
export function useCredentialsForm(mode: AuthMode, invite?: string) {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    setError("");
    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            email: values.email,
            password: values.password,
            name: fallbackName(values),
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
          });
    if (result.error) {
      setError(
        result.error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "Email ou mot de passe incorrect."
          : (result.error.message ?? "Impossible de continuer.")
      );
      return;
    }
    if (invite) {
      await navigate({ to: PAGES.INVITE, search: { token: invite } });
    } else {
      await navigate({ to: PAGES.HOME, search: {} });
    }
  });
  return { form, submit, error, setError };
}
