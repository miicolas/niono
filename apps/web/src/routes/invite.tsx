import { AlertDescription, Alert } from "@/components/ui/alert";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { authClient, authResult } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
export const Route = createFileRoute("/invite")({
  ssr: false,
  validateSearch: z.object({
    invitationId: z.string().min(1).max(200).optional().catch(undefined),
  }),
  component: Invitation,
});
function Invitation() {
  const { invitationId } = Route.useSearch();
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
      <BrandLogo />
      <h1>Votre équipe vous attend.</h1>
      <p className="muted">
        Connectez-vous avec l’adresse email qui a reçu cette invitation.
      </p>
      {!invitationId ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            Ce lien d’invitation est invalide.
          </AlertDescription>
        </Alert>
      ) : session.isPending ? (
        <p>Vérification de votre compte…</p>
      ) : !session.data?.data ? (
        <Link to="/login" search={{ invite: invitationId }}>
          <Button>Se connecter ou créer un compte</Button>
        </Link>
      ) : !session.data.data.user.emailVerified ? (
        <>
          <p>Vérifiez votre email avant de rejoindre cet espace.</p>
          <Button
            onClick={async () => {
              const r = await authClient.sendVerificationEmail({
                email: session.data!.data!.user.email,
                callbackURL: `/invite?invitationId=${encodeURIComponent(invitationId)}`,
              });
              setError(
                r.error?.message ?? "Le lien de vérification a été envoyé.",
              );
            }}
          >
            Recevoir le lien de vérification
          </Button>
          <Button variant="outline" onClick={() => void session.refetch()}>
            J’ai vérifié mon email
          </Button>
        </>
      ) : (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = authResult(
                await authClient.organization.acceptInvitation({
                  invitationId,
                }),
              );
              await cache.invalidateQueries({ queryKey: ["bootstrap"] });
              await navigate({
                to: "/",
                search: { w: result.invitation.organizationId },
              });
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Invitation indisponible.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Rejoindre l’espace
        </Button>
      )}
      {error && <p role="status">{error}</p>}
    </main>
  );
}
