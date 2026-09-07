import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PAGES } from "@/constants/pages";
import { PROJECT } from "@/constants/project";
import { authClient } from "@/lib/auth/client";
import { orpcClient } from "@/orpc/client";
import { VerifyEmailStep } from "./verify-email-step";

/** Acceptation d'une invitation : exige un compte connecté dont l'adresse est vérifiée. */
export function InviteScreen({ token }: { token?: string }) {
  const session = useQuery({
    queryKey: ["invite-session"],
    queryFn: () => authClient.getSession(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const user = session.data?.data?.user;
  const accept = async () => {
    if (!token) {
      return;
    }
    setBusy(true);
    try {
      const result = await orpcClient.workspaces.accept({ token });
      await cache.invalidateQueries({ queryKey: ["bootstrap"] });
      await navigate({ to: PAGES.HOME, search: { w: result.workspaceId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invitation indisponible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="standalone-form">
      <span className="brand-mark">{PROJECT.MARK}</span>
      <h1>Votre équipe vous attend.</h1>
      <p className="muted">
        Connectez-vous avec l’adresse email qui a reçu cette invitation.
      </p>
      {!token && <p role="alert">Ce lien d’invitation est invalide.</p>}
      {token && session.isPending && <p>Vérification de votre compte…</p>}
      {token && !session.isPending && !user && (
        <Link search={{ invite: token }} to={PAGES.SIGN_IN}>
          <Button>Se connecter ou créer un compte</Button>
        </Link>
      )}
      {token && user && !user.emailVerified && (
        <VerifyEmailStep
          email={user.email}
          onRefresh={() => session.refetch()}
          onStatus={setError}
          token={token}
        />
      )}
      {token && user?.emailVerified && (
        <Button disabled={busy} onClick={accept}>
          Rejoindre l’espace
        </Button>
      )}
      {error && <output className="status-message">{error}</output>}
    </main>
  );
}
