import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/constants/pages";
import { PROJECT } from "@/constants/project";
import { authClient } from "@/lib/auth/client";

/** Choix d'un nouveau mot de passe à partir du lien reçu par email. */
export function ResetPasswordForm({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <main className="standalone-form">
      <span className="brand-mark">{PROJECT.MARK}</span>
      <h1>Un nouveau départ.</h1>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!token) {
            setMessage("Ce lien est invalide.");
            return;
          }
          const result = await authClient.resetPassword({
            newPassword: password,
            token,
          });
          setMessage(
            result.error?.message ?? "Votre mot de passe a été modifié."
          );
          setDone(!result.error);
        }}
      >
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input
          autoComplete="new-password"
          id="new-password"
          minLength={10}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <Button disabled={done} type="submit">
          Enregistrer
        </Button>
      </form>
      <output className="status-message">{message}</output>
      <Link to={PAGES.SIGN_IN}>Retour à la connexion</Link>
    </main>
  );
}
