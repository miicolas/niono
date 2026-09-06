import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  FileText,
  Layers,
  MoveUpRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().max(100).optional(),
  email: z.email("Entrez une adresse email valide."),
  password: z.string().min(10, "Utilisez au moins 10 caractères."),
});
export function AuthScreen({ invite }: { invite?: string }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const submit = form.handleSubmit(async (values) => {
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
    if (invite) await navigate({ to: "/invite", search: { token: invite } });
    else await navigate({ to: "/", search: {} });
  });
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <a className="brand" href="/">
          <span className="brand-mark">D</span>DigiPM
        </a>
        <div className="auth-story-content">
          <span className="eyebrow">DE L’ESPACE POUR L’ESSENTIEL</span>
          <h1>
            Les idées prennent
            <br />
            vie ici<span>.</span>
          </h1>
          <p>
            Vos notes, vos projets, votre prochain grand pas.
            <br />
            Un espace qui vous ressemble.
          </p>
          <div className="auth-paper">
            <div>
              <FileText size={18} />
              <span>Une idée pour commencer</span>
              <MoveUpRight size={14} />
            </div>
            <h3>
              Tout commence
              <br />
              par une page blanche.
            </h3>
            <div className="paper-lines">
              <i />
              <i />
              <i />
            </div>
            <span className="paper-note">Faites de la place à vos idées.</span>
          </div>
        </div>
        <footer>
          <Layers size={14} /> Votre espace. Vos données.
        </footer>
      </aside>
      <main className="auth-form-side">
        <div className="auth-form">
          <span className="brand-mark mobile-brand">D</span>
          <h2>
            {mode === "signup"
              ? "Votre espace vous attend."
              : mode === "forgot"
                ? "Retrouvons votre accès."
                : "Ravi de vous retrouver."}
          </h2>
          <p className="muted">
            {mode === "signup"
              ? "Créez un compte pour commencer à écrire."
              : mode === "forgot"
                ? "Recevez un lien pour choisir un nouveau mot de passe."
                : "Connectez-vous et reprenez le fil de vos idées."}
          </p>
          {mode === "forgot" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                const email = form.getValues("email");
                if (!z.email().safeParse(email).success) {
                  setError("Entrez une adresse email valide.");
                  return;
                }
                const result = await authClient.requestPasswordReset({
                  email,
                  redirectTo: "/reset-password",
                });
                if (result.error)
                  setError(result.error.message ?? "Réessayez plus tard.");
                else setSent(true);
              }}
            >
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
              />
              <Button className="auth-submit" type="submit">
                Envoyer le lien <ArrowRight size={16} />
              </Button>
              {sent && (
                <p role="status" className="success-text">
                  Si un compte existe, un email de récupération a été envoyé.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={submit}>
              {mode === "signup" && (
                <div className="form-field">
                  <Label htmlFor="name">Votre nom</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="Comment vous appelez-vous ?"
                    {...form.register("name")}
                  />
                </div>
              )}
              <div className="form-field">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.fr"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <span className="field-error">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <div className="field-label">
                  <Label htmlFor="password">Mot de passe</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  placeholder="Au moins 10 caractères"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <span className="field-error">
                    {form.formState.errors.password.message}
                  </span>
                )}
              </div>
              <Button
                className="auth-submit"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    {mode === "signup" ? "Créer mon espace" : "Se connecter"}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <p className="auth-switch">
            {mode === "login"
              ? "Pas encore de compte ?"
              : mode === "signup"
                ? "Déjà chez vous ?"
                : ""}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
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
export function ResetPasswordScreen({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <main className="standalone-form">
      <span className="brand-mark">D</span>
      <h1>Un nouveau départ.</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!token) {
            setMessage("Ce lien est invalide.");
            return;
          }
          const r = await authClient.resetPassword({
            newPassword: password,
            token,
          });
          setMessage(r.error?.message ?? "Votre mot de passe a été modifié.");
          setDone(!r.error);
        }}
      >
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input
          id="new-password"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button disabled={done} type="submit">
          Enregistrer
        </Button>
      </form>
      <p role="status">{message}</p>
      <Link to="/login">Retour à la connexion</Link>
    </main>
  );
}
