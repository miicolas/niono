import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { orpcClient } from "@/orpc/client";
export const Route = createFileRoute("/invite")({
  ssr: false,
  validateSearch: z.object({
    token: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional()
      .catch(undefined),
  }),
  component: Invitation,
});
function Invitation() {
  const { token } = Route.useSearch();
  const session = useQuery({
    queryKey: ["invite-session"],
    queryFn: () => authClient.getSession(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const cache = useQueryClient();
  return (
    <main className="standalone-form">
      <span className="brand-mark">D</span>
      <h1>Votre équipe vous attend.</h1>
      <p className="muted">
        Connectez-vous avec l’adresse email qui a reçu cette invitation.
      </p>
      {token ? (
        session.isPending ? (
          <p>Vérification de votre compte…</p>
        ) : session.data?.data ? (
          session.data.data.user.emailVerified ? (
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await orpcClient.workspaces.accept({ token });
                  await cache.invalidateQueries({ queryKey: ["bootstrap"] });
                  await navigate({
                    to: "/",
                    search: { w: result.workspaceId },
                  });
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Invitation indisponible."
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Rejoindre l’espace
            </Button>
          ) : (
            <>
              <p>Vérifiez votre email avant de rejoindre cet espace.</p>
              <Button
                onClick={async () => {
                  const r = await authClient.sendVerificationEmail({
                    email: session.data!.data!.user.email,
                    callbackURL: `/invite?token=${token}`,
                  });
                  setError(
                    r.error?.message ?? "Le lien de vérification a été envoyé."
                  );
                }}
              >
                Recevoir le lien de vérification
              </Button>
              <Button onClick={() => void session.refetch()} variant="outline">
                J’ai vérifié mon email
              </Button>
            </>
          )
        ) : (
          <Link search={{ invite: token }} to="/login">
            <Button>Se connecter ou créer un compte</Button>
          </Link>
        )
      ) : (
        <p role="alert">Ce lien d’invitation est invalide.</p>
      )}
      {error && <p role="status">{error}</p>}
    </main>
  );
}
