import { useSyncExternalStore } from "react";
import {
  ArrowLeft,
  FileQuestion,
  LockKeyhole,
  LogIn,
  RotateCcw,
  Unplug,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { subscribeToConnection } from "./subscribe-to-connection";
import { ContentState } from "./content-state";
import { AppState } from "./app-state";

export function RequestError({
  error,
  title = "Impossible de charger ce contenu",
  description = "Le chargement a été interrompu. Réessayez dans quelques instants.",
  onRetry,
  retrying = false,
  onHome,
  fullPage = false,
  compact = false,
}: {
  error?: unknown;
  title?: string;
  description?: string;
  onRetry: () => void;
  retrying?: boolean;
  onHome?: () => void;
  fullPage?: boolean;
  compact?: boolean;
}) {
  const online = useSyncExternalStore(
    subscribeToConnection,
    () => navigator.onLine,
    () => true,
  );
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;
  let Icon = Unplug;
  if (!online) {
    Icon = WifiOff;
    title = "La connexion est interrompue";
    description = "Vérifiez votre connexion à Internet, puis réessayez.";
  } else if (code === "UNAUTHORIZED") {
    Icon = LogIn;
    title = "Reconnectez-vous à votre espace";
    description =
      "Votre session a expiré. Connectez-vous pour retrouver vos pages.";
  } else if (code === "FORBIDDEN") {
    Icon = LockKeyhole;
    title = "Ce contenu n’est pas accessible";
    description =
      "Vérifiez le compte utilisé ou demandez l’accès à un membre de votre espace.";
  } else if (code === "NOT_FOUND") {
    Icon = FileQuestion;
    title = "Cette page est introuvable";
    description =
      "Elle a peut-être été supprimée, ou vous n’y avez plus accès.";
  }
  const state = (
    <ContentState
      icon={Icon}
      title={title}
      description={description}
      alert
      compact={compact}
      headingLevel={fullPage ? 1 : 2}
    >
      {code === "UNAUTHORIZED" && online ? (
        <Button asChild>
          <a href="/login">
            <LogIn aria-hidden="true" />
            Se connecter
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          aria-busy={retrying}
        >
          {retrying ? (
            <Spinner aria-hidden="true" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          {retrying ? "Chargement…" : "Réessayer"}
        </Button>
      )}
      {onHome && (
        <Button type="button" variant="ghost" onClick={onHome}>
          <ArrowLeft aria-hidden="true" />
          Retour à l’accueil
        </Button>
      )}
    </ContentState>
  );
  return fullPage ? <AppState>{state}</AppState> : state;
}
