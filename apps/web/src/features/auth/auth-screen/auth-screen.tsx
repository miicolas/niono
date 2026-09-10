import { useFormSubmit } from "@/hooks/use-form-submit";
import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { FormInput } from "@/components/form-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./auth-shell";
import { PasswordInput } from "./password-input";
import { schema } from "./shared";

export function AuthScreen({ invite }: { invite?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: {
      onSubmit:
        mode === "forgot" ? schema.extend({ password: z.string() }) : schema,
    },
    onSubmit: async ({ value: values }) => {
      try {
        if (mode === "forgot") {
          setError("");
          const result = await authClient.requestPasswordReset({
            email: values.email,
            redirectTo: "/reset-password",
          });
          if (result.error)
            setError(result.error.message ?? "Réessayez plus tard.");
          else setSent(true);
          return;
        }
        setError("");
        const result =
          mode === "signup"
            ? await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: values.name?.trim() || values.email.split("@")[0]!,
              })
            : await authClient.signIn.email({
                email: values.email,
                password: values.password,
              });
        if (result.error) {
          setError(
            result.error.code === "INVALID_EMAIL_OR_PASSWORD"
              ? "Email ou mot de passe incorrect."
              : (result.error.message ?? "Impossible de continuer."),
          );
          return;
        }
        if (invite)
          await navigate({ to: "/invite", search: { invitationId: invite } });
        else await navigate({ to: "/", search: {} });
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Impossible de continuer.",
        );
      }
    },
  });
  const submitForm = useFormSubmit(form);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <AuthShell>
      <div className="auth-form">
        <span className="auth-eyebrow">
          {mode === "signup"
            ? "FAISONS PLACE À VOS IDÉES"
            : mode === "forgot"
              ? "ON VOUS AIDE À REVENIR"
              : "BIENVENUE CHEZ VOUS"}
        </span>
        <h1>
          {mode === "signup"
            ? "Tout commence ici."
            : mode === "forgot"
              ? "Mot de passe oublié ?"
              : "Reprenez le fil."}
        </h1>
        <p className="muted">
          {mode === "signup"
            ? "Un compte, et de la place pour tous vos projets."
            : mode === "forgot"
              ? "Recevez un lien pour choisir un nouveau mot de passe."
              : "Connectez-vous à votre espace DigiPM."}
        </p>
        {invite && (
          <p className="auth-invite">
            Connectez-vous ou créez un compte pour rejoindre l’espace qui vous a
            invité.
          </p>
        )}
        {mode === "forgot" && sent ? (
          <div className="auth-recovery-success">
            <MailCheck size={28} aria-hidden="true" />
            <Alert role="status">
              <AlertDescription>
                Si un compte existe pour cette adresse, un email de récupération
                a été envoyé. Consultez aussi vos courriers indésirables.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm();
            }}
            aria-busy={isSubmitting}
            noValidate
          >
            {mode === "signup" && (
              <form.Field name="name">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Votre nom"
                    autoComplete="name"
                    placeholder="Comment vous appelez-vous ?"
                    disabled={isSubmitting}
                  />
                )}
              </form.Field>
            )}
            <form.Field name="email">
              {(field) => (
                <FormInput
                  field={field}
                  label="Adresse email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="vous@exemple.fr"
                  disabled={isSubmitting}
                />
              )}
            </form.Field>
            {mode !== "forgot" && (
              <>
                <form.Field name="password">
                  {(field) => (
                    <PasswordInput
                      key={mode}
                      field={field}
                      label="Mot de passe"
                      type="password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      placeholder={
                        mode === "signup"
                          ? "Au moins 10 caractères"
                          : "Votre mot de passe"
                      }
                      description={
                        mode === "signup"
                          ? "Utilisez au moins 10 caractères."
                          : undefined
                      }
                      disabled={isSubmitting}
                    />
                  )}
                </form.Field>
                {mode === "login" && (
                  <Button
                    type="button"
                    variant="link"
                    className="auth-forgot"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      form.reset(
                        {
                          name: "",
                          email: form.state.values.email,
                          password: "",
                        },
                        { keepDefaultValues: true },
                      );
                    }}
                  >
                    Mot de passe oublié ?
                  </Button>
                )}
              </>
            )}
            <Button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  {mode === "forgot"
                    ? "Envoi en cours…"
                    : mode === "signup"
                      ? "Création en cours…"
                      : "Connexion en cours…"}
                </>
              ) : (
                <>
                  {mode === "signup"
                    ? "Créer mon espace"
                    : mode === "forgot"
                      ? "Envoyer le lien"
                      : "Se connecter"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="auth-switch">
          {mode === "login"
            ? "Pas encore de compte ?"
            : mode === "signup"
              ? "Vous avez déjà un compte ?"
              : ""}{" "}
          <Button
            variant="link"
            className="auth-switch-button"
            disabled={isSubmitting}
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              form.reset(
                {
                  name: "",
                  email: form.state.values.email,
                  password: "",
                },
                { keepDefaultValues: true },
              );
              setSent(false);
              setError("");
            }}
          >
            {mode === "forgot" && <ArrowLeft size={15} />}
            {mode === "login"
              ? "Créer un compte"
              : mode === "forgot"
                ? "Retour à la connexion"
                : "Se connecter"}
          </Button>
        </p>
      </div>
    </AuthShell>
  );
}
