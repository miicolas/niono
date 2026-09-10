import { OrganizationMemberRow } from "./organization-member-row";
import { TeamSettings } from "./organization-team-settings";
import { ActionForm } from "@/components/action-form";
import { z } from "zod";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient, authResult } from "@/lib/auth-client";
import { reportError } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

export function OrganizationSettings({
  organizationId,
  userId,
  tab,
}: {
  organizationId: string;
  userId: string;
  tab: "members" | "teams";
}) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const members = useQuery({
    queryKey: ["organization", organizationId, "members", offset],
    queryFn: async () =>
      authResult(
        await authClient.organization.listMembers({
          query: {
            organizationId,
            limit: 100,
            offset,
            sortBy: "createdAt",
            sortDirection: "asc",
          },
        }),
      ),
  });
  const permissions = useQuery({
    queryKey: ["organization", organizationId, "manage", tab],
    queryFn: async () =>
      authResult(
        await authClient.organization.hasPermission({
          organizationId,
          permissions:
            tab === "members"
              ? {
                  member: ["update", "delete"],
                  invitation: ["create", "cancel"],
                }
              : { team: ["create", "update", "delete"] },
        }),
      ),
  });
  const canManage = permissions.data?.success === true;
  const invitations = useQuery({
    queryKey: ["organization", organizationId, "invitations"],
    queryFn: async () =>
      authResult(
        await authClient.organization.listInvitations({
          query: { organizationId },
        }),
      ),
    enabled: canManage && tab === "members",
  });
  const teams = useQuery({
    queryKey: ["organization", organizationId, "teams"],
    queryFn: async () =>
      authResult(
        await authClient.organization.listTeams({ query: { organizationId } }),
      ),
    enabled: tab === "teams",
  });
  const myTeams = useQuery({
    queryKey: ["organization", organizationId, "my-teams"],
    queryFn: async () =>
      authResult(await authClient.organization.listUserTeams()),
    enabled: tab === "teams",
  });
  const refresh = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["organization", organizationId] }),
      cache.invalidateQueries({ queryKey: ["members", organizationId] }),
      cache.invalidateQueries({ queryKey: ["page"] }),
      cache.invalidateQueries({ queryKey: ["bootstrap"] }),
    ]);
  };
  const mutate = async (work: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    try {
      await work();
      await refresh();
      if (message) toast.success(message);
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };
  const error =
    members.error ??
    permissions.error ??
    invitations.error ??
    teams.error ??
    myTeams.error;
  return (
    <div className="grid gap-4">
      {error && <p role="alert">{error.message}</p>}
      {members.isPending && <p className="muted">Chargement des membres…</p>}
      {tab === "members" && (
        <>
          <div>
            {members.data?.members.map((member) => (
              <OrganizationMemberRow
                key={member.id}
                member={member}
                organizationId={organizationId}
                canManage={canManage}
                busy={busy}
                mutate={mutate}
              />
            ))}
          </div>
          {(members.data?.total ?? 0) > 100 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 100))}
              >
                Précédents
              </Button>
              <Button
                variant="outline"
                disabled={offset + 100 >= (members.data?.total ?? 0)}
                onClick={() => setOffset(offset + 100)}
              >
                Suivants
              </Button>
            </div>
          )}
          {canManage && (
            <>
              <ActionForm
                schema={z.object({
                  email: z.email("Saisissez une adresse email valide."),
                  role: z.enum(["editor", "viewer"]),
                })}
                defaultValues={{ email: "", role: "editor" }}
                fields={[
                  {
                    name: "email",
                    label: "Inviter un membre",
                    type: "email",
                    placeholder: "personne@exemple.fr",
                  },
                  {
                    name: "role",
                    label: "Rôle de l’invité",
                    options: [
                      { value: "editor", label: "Peut modifier" },
                      { value: "viewer", label: "Peut consulter" },
                    ],
                  },
                ]}
                submitLabel="Envoyer l’invitation"
                resetOnSuccess
                onSubmit={async ({ email, role }) => {
                  authResult(
                    await authClient.organization.inviteMember({
                      organizationId,
                      email,
                      role,
                    }),
                  );
                  await refresh();
                  toast.success("Invitation envoyée");
                }}
              />
              {invitations.data
                ?.filter((invitation) => invitation.status === "pending")
                .map((invitation) => (
                  <div className="settings-row" key={invitation.id}>
                    <span>
                      {invitation.email}
                      <p>
                        {new Date(invitation.expiresAt) > new Date()
                          ? "Invitation en attente"
                          : "Invitation expirée"}
                      </p>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void mutate(async () => {
                          authResult(
                            await authClient.organization.cancelInvitation({
                              invitationId: invitation.id,
                            }),
                          );
                        }, "Invitation annulée")
                      }
                    >
                      Annuler
                    </Button>
                  </div>
                ))}
            </>
          )}
        </>
      )}
      {tab === "teams" && (
        <>
          <p className="muted text-sm">
            Regroupez les membres de cet espace en équipes.
          </p>
          {teams.isPending ? (
            <p>Chargement des équipes…</p>
          ) : (
            teams.data?.length === 0 && (
              <p className="muted">Aucune équipe pour le moment.</p>
            )
          )}
          {teams.data?.map((team) => (
            <TeamSettings
              key={team.id}
              team={team}
              organizationId={organizationId}
              userId={userId}
              canManage={canManage}
              joined={
                myTeams.data?.some((entry) => entry.id === team.id) ?? false
              }
              people={members.data?.members.map((m) => m.user) ?? []}
              busy={busy}
              mutate={mutate}
            />
          ))}
          {canManage && (
            <ActionForm
              schema={z.object({
                name: z.string().trim().min(1, "Nommez cette équipe.").max(100),
              })}
              defaultValues={{ name: "" }}
              fields={[
                {
                  name: "name",
                  label: "Nouvelle équipe",
                  placeholder: "Design, Produit…",
                  maxLength: 100,
                },
              ]}
              submitLabel="Créer l’équipe"
              resetOnSuccess
              onSubmit={async ({ name }) => {
                const team = authResult(
                  await authClient.organization.createTeam({
                    organizationId,
                    name,
                  }),
                );
                authResult(
                  await authClient.organization.addTeamMember({
                    organizationId,
                    teamId: team.id,
                    userId,
                  }),
                );
                await refresh();
                toast.success("Équipe créée");
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
