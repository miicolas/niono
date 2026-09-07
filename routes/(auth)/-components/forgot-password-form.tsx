import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGES } from "@/constants/pages";
import { authClient } from "@/lib/auth/client";

type Props = {
  email: string;
  onEmailChange: (email: string) => void;
  onError: (message: string) => void;
};

/** Demande d'un lien de réinitialisation ; la réponse reste neutre qu'un compte existe ou non. */
export function ForgotPasswordForm({ email, onEmailChange, onError }: Props) {
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        onError("");
        if (!z.email().safeParse(email).success) {
          onError("Entrez une adresse email valide.");
          return;
        }
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: PAGES.RESET_PASSWORD,
        });
        if (result.error) {
          onError(result.error.message ?? "Réessayez plus tard.");
        } else {
          setSent(true);
        }
      }}
    >
      <Label htmlFor="email">Adresse email</Label>
      <Input
        autoComplete="email"
        id="email"
        onChange={(event) => onEmailChange(event.target.value)}
        type="email"
        value={email}
      />
      <Button className="auth-submit" type="submit">
        Envoyer le lien <ArrowRight size={16} />
      </Button>
      {sent && (
        <output className="success-text">
          Si un compte existe, un email de récupération a été envoyé.
        </output>
      )}
    </form>
  );
}
