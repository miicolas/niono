import { useState } from "react";
import { PROJECT } from "@/constants/project";
import {
  type AuthMode,
  authModeSubtitle,
  authModeTitle,
} from "../-lib/auth-mode";
import { useCredentialsForm } from "../-lib/use-credentials-form";
import { AuthStory } from "./auth-story";
import { CredentialsFields } from "./credentials-fields";
import { ForgotPasswordForm } from "./forgot-password-form";

/** Écran de connexion, d'inscription et de mot de passe oublié. */
export function SignInForm({ invite }: { invite?: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const { form, submit, error, setError } = useCredentialsForm(mode, invite);
  const switchTo = (next: AuthMode) => {
    setMode(next);
    setError("");
  };
  return (
    <div className="auth-layout">
      <AuthStory />
      <main className="auth-form-side">
        <div className="auth-form">
          <span className="brand-mark mobile-brand">{PROJECT.MARK}</span>
          <h2>{authModeTitle(mode)}</h2>
          <p className="muted">{authModeSubtitle(mode)}</p>
          {mode === "forgot" ? (
            <ForgotPasswordForm
              email={form.watch("email")}
              onEmailChange={(email) => form.setValue("email", email)}
              onError={setError}
            />
          ) : (
            <CredentialsFields
              form={form}
              mode={mode}
              onForgot={() => switchTo("forgot")}
              onSubmit={submit}
            />
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="auth-switch">
            {mode === "login" && "Pas encore de compte ?"}
            {mode === "signup" && "Déjà chez vous ?"}{" "}
            <button
              onClick={() => switchTo(mode === "login" ? "signup" : "login")}
              type="button"
            >
              {mode === "login" ? "Créer un espace" : "Se connecter"}
            </button>
          </p>
          <div className="auth-footnote">
            Un espace de travail libre et indépendant.
          </div>
        </div>
      </main>
    </div>
  );
}
