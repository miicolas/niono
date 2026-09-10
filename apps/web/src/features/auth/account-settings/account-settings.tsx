import { useFormSubmit } from "@/hooks/use-form-submit";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { BadgeCheck, Mail } from "lucide-react";
import { useForm, useStore } from "@tanstack/react-form";
import { FormInput } from "@/components/form-input";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/notifications";

export function AccountSettings({
  name,
  email,
  emailVerified,
  onUpdated,
}: {
  name: string;
  email: string;
  emailVerified: boolean;
  onUpdated: () => Promise<void>;
}) {
  const [verifying, setVerifying] = useState(false);
  const profile = useForm({
    onSubmit: async ({ value: values }) => {
      try {
        const result = await authClient.updateUser({
          name: values.name.trim(),
        });
        if (result.error) throw new Error(result.error.message);
        await onUpdated();
        profile.reset({ name: values.name.trim() });
        toast.success("Profil enregistré");
      } catch (e) {
        reportError(e);
      }
    },
    defaultValues: { name },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(1, "Saisissez votre nom.").max(100),
      }),
    },
  });
  const submitProfile = useFormSubmit(profile);
  const profileState = useStore(profile.store);
  return (
    <>
      <div className="settings-profile-summary">
        <Avatar className="settings-profile-avatar" aria-hidden="true">
          <AvatarFallback>
            {name.slice(0, 1).toLocaleUpperCase("fr")}
          </AvatarFallback>
        </Avatar>
        <div>
          <strong>{name}</strong>
          <p>Votre compte personnel</p>
        </div>
      </div>
      <section
        className="settings-section"
        aria-labelledby="settings-profile-title"
      >
        <h3 id="settings-profile-title">Informations du profil</h3>
        <p>Le nom que les membres de votre espace verront.</p>
        <form
          className="settings-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submitProfile();
          }}
        >
          <profile.Field name="name">
            {(field) => (
              <FormInput
                field={field}
                label="Votre nom"
                autoComplete="name"
                maxLength={100}
                disabled={profileState.isSubmitting}
              />
            )}
          </profile.Field>
          <div className="settings-form-footer">
            <Button
              type="submit"
              disabled={profileState.isSubmitting || !profileState.isDirty}
            >
              {profileState.isSubmitting
                ? "Enregistrement…"
                : "Enregistrer le profil"}
            </Button>
          </div>
        </form>
      </section>
      <section
        className="settings-section"
        aria-labelledby="settings-email-title"
      >
        <h3 id="settings-email-title">Adresse email</h3>
        <p>Utilisée pour vous connecter et récupérer votre compte.</p>
        <div className="settings-email-row">
          <Mail size={17} aria-hidden="true" />
          <span>{email}</span>
          {emailVerified && (
            <Badge variant="secondary" className="settings-badge">
              <BadgeCheck size={14} aria-hidden="true" />
              Vérifiée
            </Badge>
          )}
        </div>
        {!emailVerified && (
          <div className="settings-section-row">
            <p>Confirmez votre adresse pour sécuriser votre compte.</p>
            <Button
              size="sm"
              variant="outline"
              disabled={verifying}
              onClick={async () => {
                setVerifying(true);
                try {
                  const result = await authClient.sendVerificationEmail({
                    email,
                    callbackURL: "/",
                  });
                  if (result.error) throw new Error(result.error.message);
                  toast.success("Email de vérification envoyé");
                } catch (error) {
                  reportError(error);
                } finally {
                  setVerifying(false);
                }
              }}
            >
              {verifying ? "Envoi en cours…" : "Vérifier mon email"}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
