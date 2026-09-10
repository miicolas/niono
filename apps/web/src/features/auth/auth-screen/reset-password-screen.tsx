import { useFormSubmit } from "@/hooks/use-form-submit";
import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { FormInput } from "@/components/form-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

export function ResetPasswordScreen({ token }: { token?: string }) {
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm({
    defaultValues: { password: "" },
    validators: {
      onSubmit: z.object({
        password: z
          .string()
          .min(10, "Utilisez au moins 10 caractères.")
          .max(128),
      }),
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setMessage("Ce lien est invalide.");
        return;
      }
      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });
        setMessage(
          result.error?.message ?? "Votre mot de passe a été modifié.",
        );
        setDone(!result.error);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Réessayez plus tard.",
        );
      }
    },
  });
  const submitForm = useFormSubmit(form);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  return (
    <main className="standalone-form">
      <BrandLogo />
      <h1>Un nouveau départ.</h1>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
        noValidate
      >
        <form.Field name="password">
          {(field) => (
            <FormInput
              field={field}
              label="Nouveau mot de passe"
              type="password"
              autoComplete="new-password"
              disabled={done || isSubmitting}
            />
          )}
        </form.Field>
        <Button disabled={done || isSubmitting} type="submit">
          Enregistrer
        </Button>
      </form>
      {message && (
        <Alert role="status" variant={done ? "default" : "destructive"}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <Link to="/login">Retour à la connexion</Link>
    </main>
  );
}
