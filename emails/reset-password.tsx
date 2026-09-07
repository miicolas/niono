import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";
import { EmailText } from "./components/email-text";

export const resetPasswordSubject = "Réinitialiser votre mot de passe DigiPM";

export default function ResetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout previewText="Choisissez un nouveau mot de passe">
      <EmailText>Bonjour {name},</EmailText>
      <EmailText>Choisissez un nouveau mot de passe :</EmailText>
      <EmailButton href={url}>Choisir un nouveau mot de passe</EmailButton>
      <EmailText>
        Si vous n'avez pas demandé ce changement, ignorez ce message.
      </EmailText>
    </EmailLayout>
  );
}
