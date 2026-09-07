import { ArrowRight, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Credentials } from "@/validators/auth";
import type { AuthMode } from "../-lib/auth-mode";

type Props = {
  mode: Exclude<AuthMode, "forgot">;
  form: UseFormReturn<Credentials>;
  onSubmit: () => void;
  onForgot: () => void;
};

/** Champs nom / email / mot de passe partagés par la connexion et l'inscription. */
export function CredentialsFields({ mode, form, onSubmit, onForgot }: Props) {
  const { errors, isSubmitting } = form.formState;
  return (
    <form onSubmit={onSubmit}>
      {mode === "signup" && (
        <div className="form-field">
          <Label htmlFor="name">Votre nom</Label>
          <Input
            autoComplete="name"
            id="name"
            placeholder="Comment vous appelez-vous ?"
            {...form.register("name")}
          />
        </div>
      )}
      <div className="form-field">
        <Label htmlFor="email">Adresse email</Label>
        <Input
          autoComplete="email"
          id="email"
          placeholder="vous@exemple.fr"
          type="email"
          {...form.register("email")}
        />
        {errors.email && (
          <span className="field-error">{errors.email.message}</span>
        )}
      </div>
      <div className="form-field">
        <div className="field-label">
          <Label htmlFor="password">Mot de passe</Label>
          {mode === "login" && (
            <button className="text-button" onClick={onForgot} type="button">
              Mot de passe oublié ?
            </button>
          )}
        </div>
        <Input
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          id="password"
          placeholder="Au moins 10 caractères"
          type="password"
          {...form.register("password")}
        />
        {errors.password && (
          <span className="field-error">{errors.password.message}</span>
        )}
      </div>
      <Button className="auth-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <>
            {mode === "signup" ? "Créer mon espace" : "Se connecter"}
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
