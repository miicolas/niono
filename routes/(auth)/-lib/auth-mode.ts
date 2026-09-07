export type AuthMode = "login" | "signup" | "forgot";

const TITLES: Record<AuthMode, string> = {
  login: "Ravi de vous retrouver.",
  signup: "Votre espace vous attend.",
  forgot: "Retrouvons votre accès.",
};

const SUBTITLES: Record<AuthMode, string> = {
  login: "Connectez-vous et reprenez le fil de vos idées.",
  signup: "Créez un compte pour commencer à écrire.",
  forgot: "Recevez un lien pour choisir un nouveau mot de passe.",
};

export const authModeTitle = (mode: AuthMode) => TITLES[mode];
export const authModeSubtitle = (mode: AuthMode) => SUBTITLES[mode];
