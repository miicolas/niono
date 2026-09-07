import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";
import { EmailText } from "./components/email-text";

export const verifyEmailSubject = "Vérifier votre adresse DigiPM";

export default function VerifyEmail({ url }: { url: string }) {
  return (
    <EmailLayout previewText="Vérifiez votre adresse email">
      <EmailText>Vérifiez votre adresse :</EmailText>
      <EmailButton href={url}>Vérifier mon adresse</EmailButton>
    </EmailLayout>
  );
}
