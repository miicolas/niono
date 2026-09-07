import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";
import { EmailText } from "./components/email-text";

export const workspaceInvitationSubject = "Votre invitation DigiPM";

export default function WorkspaceInvitationEmail({ url }: { url: string }) {
  return (
    <EmailLayout previewText="Vous avez été invité dans un espace DigiPM">
      <EmailText>
        Vous avez été invité dans un espace DigiPM. Connectez-vous ou
        inscrivez-vous avec cette adresse, puis ouvrez ce lien :
      </EmailText>
      <EmailButton href={url}>Rejoindre l'espace</EmailButton>
    </EmailLayout>
  );
}
