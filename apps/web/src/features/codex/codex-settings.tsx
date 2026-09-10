import { AlertDescription, Alert } from "@/components/ui/alert";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { OpenAILogo } from "@/components/openai-logo";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
export function CodexSettings() {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = useQuery({
    queryKey: ["codex-status"],
    queryFn: () => client.codex.status(),
    refetchInterval: (q) =>
      q.state.data?.status === "connecting" ? 1000 : false,
    retry: false,
  });
  const run = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
      await cache.invalidateQueries({ queryKey: ["codex-status"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="codex-settings"
      aria-label="Connexion personnelle à Codex"
    >
      <h3>
        <OpenAILogo width={20} height={20} /> Votre compte Codex
      </h3>
      <p className="muted">
        Votre connexion et vos conversations sont personnelles. Codex utilise
        l’accès associé à votre compte ChatGPT.
      </p>
      {status.isPending ? (
        <p role="status">Vérification de la connexion…</p>
      ) : status.data?.status === "connected" ? (
        <>
          <p role="status">
            Connecté{status.data.email ? ` · ${status.data.email}` : ""}
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void run(() => client.codex.disconnect())}
          >
            Déconnecter Codex
          </Button>
        </>
      ) : status.data?.login ? (
        <>
          <p>Ouvrez la page de connexion et saisissez ce code :</p>
          <strong className="codex-device-code">
            {status.data.login.userCode}
          </strong>
          <Button asChild>
            <a
              href={status.data.login.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Se connecter à Codex <ExternalLink size={14} />
            </a>
          </Button>
          <p role="status">En attente de votre connexion…</p>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void run(() => client.codex.disconnect())}
          >
            Annuler
          </Button>
        </>
      ) : (
        <Button
          disabled={busy}
          onClick={() => void run(() => client.codex.connect())}
        >
          {busy ? "Préparation de la connexion…" : "Connecter mon compte Codex"}
        </Button>
      )}
      {(error || status.error || status.data?.error) && (
        <Alert variant="destructive" role="alert" className="text-destructive">
          <AlertDescription>
            {error ?? status.error?.message ?? status.data?.error}
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
