import { useFormSubmit } from "@/hooks/use-form-submit";
import { LockKeyhole } from "lucide-react";
import { useForm, useStore } from "@tanstack/react-form";
import { FormInput } from "@/components/form-input";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";
import { passwordSchema } from "./shared";

export function PasswordSettings() {
  const password = useForm({
    onSubmit: async ({ value: values }) => {
      try {
        const result = await authClient.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: true,
        });
        if (result.error) throw new Error(result.error.message);
        password.reset();
        toast.success(
          "Mot de passe changé. Les autres sessions ont été fermées.",
        );
      } catch (e) {
        reportError(e);
      }
    },
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
    validators: { onSubmit: passwordSchema },
  });
  const submitPassword = useFormSubmit(password);
  const passwordState = useStore(password.store);
  return (
    <>
      <section
        className="settings-section"
        aria-labelledby="settings-password-title"
      >
        <h3 id="settings-password-title">Changer de mot de passe</h3>
        <p>Choisissez un mot de passe unique d’au moins 10 caractères.</p>
        <form
          className="settings-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitPassword();
          }}
        >
          <password.Field name="currentPassword">
            {(field) => (
              <FormInput
                field={field}
                label="Mot de passe actuel"
                type="password"
                autoComplete="current-password"
                disabled={passwordState.isSubmitting}
              />
            )}
          </password.Field>
          <password.Field name="newPassword">
            {(field) => (
              <FormInput
                field={field}
                label="Nouveau mot de passe"
                type="password"
                autoComplete="new-password"
                maxLength={128}
                disabled={passwordState.isSubmitting}
              />
            )}
          </password.Field>
          <password.Field name="confirm">
            {(field) => (
              <FormInput
                field={field}
                label="Confirmer le mot de passe"
                type="password"
                autoComplete="new-password"
                maxLength={128}
                disabled={passwordState.isSubmitting}
              />
            )}
          </password.Field>
          <div className="settings-form-footer">
            <Button type="submit" disabled={passwordState.isSubmitting}>
              {passwordState.isSubmitting
                ? "Enregistrement…"
                : "Changer le mot de passe"}
            </Button>
          </div>
        </form>
      </section>
      <div className="settings-note">
        <LockKeyhole size={17} aria-hidden="true" />
        <p>
          Après le changement, les autres sessions seront déconnectées. Vous
          resterez connecté sur cet appareil.
        </p>
      </div>
    </>
  );
}
