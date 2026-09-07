import { Button } from "@/components/ui/button";
import { PAGES } from "@/constants/pages";
import { authClient } from "@/lib/auth/client";

type Props = {
  email: string;
  token: string;
  onStatus: (message: string) => void;
  onRefresh: () => void;
};

/** Étape intermédiaire quand l'adresse du compte n'est pas encore vérifiée. */
export function VerifyEmailStep({ email, token, onStatus, onRefresh }: Props) {
  return (
    <>
      <p>Vérifiez votre email avant de rejoindre cet espace.</p>
      <Button
        onClick={async () => {
          const result = await authClient.sendVerificationEmail({
            email,
            callbackURL: `${PAGES.INVITE}?token=${token}`,
          });
          onStatus(
            result.error?.message ?? "Le lien de vérification a été envoyé."
          );
        }}
      >
        Recevoir le lien de vérification
      </Button>
      <Button onClick={onRefresh} variant="outline">
        J’ai vérifié mon email
      </Button>
    </>
  );
}
