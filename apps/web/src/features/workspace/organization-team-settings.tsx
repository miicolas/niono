import { AlertDescription, Alert } from "@/components/ui/alert";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { authClient, authResult } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";

export function TeamSettings({
  team,
  organizationId,
  userId,
  canManage,
  joined,
  people,
  busy,
  mutate,
}: {
  team: { id: string; name: string };
  organizationId: string;
  userId: string;
  canManage: boolean;
  joined: boolean;
  people: { id: string; name: string; email: string }[];
  busy: boolean;
  mutate: (work: () => Promise<unknown>, message?: string) => Promise<void>;
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const members = useQuery({
    queryKey: ["organization", organizationId, "team-members", team.id],
    queryFn: async () =>
      authResult(
        await authClient.organization.listTeamMembers({
          query: { teamId: team.id },
        }),
      ),
    enabled: joined,
  });
  return (
    <section
      className="rounded-md border p-3 grid gap-3"
      aria-label={team.name}
    >
      <div className="flex items-center justify-between gap-2">
        <strong>{team.name}</strong>
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Supprimer l’équipe ${team.name}`}
            onClick={() =>
              void mutate(async () => {
                authResult(
                  await authClient.organization.removeTeam({
                    organizationId,
                    teamId: team.id,
                  }),
                );
              }, "Équipe supprimée")
            }
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
      {members.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{members.error.message}</AlertDescription>
        </Alert>
      )}
      {joined ? (
        <>
          {members.isPending && <p className="muted">Chargement…</p>}
          {members.data?.map((membership) => {
            const person = people.find((p) => p.id === membership.userId);
            return (
              <div
                className="flex items-center justify-between gap-2"
                key={membership.id}
              >
                <span className="text-sm">
                  {person?.name ?? "Membre de l’espace"}
                </span>
                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void mutate(async () => {
                        authResult(
                          await authClient.organization.removeTeamMember({
                            organizationId,
                            teamId: team.id,
                            userId: membership.userId,
                          }),
                        );
                      })
                    }
                  >
                    Retirer
                  </Button>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <p className="muted text-sm">
          Les membres de cette équipe peuvent consulter sa composition.
        </p>
      )}
      {canManage && (
        <>
          {!joined && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void mutate(async () => {
                  authResult(
                    await authClient.organization.addTeamMember({
                      organizationId,
                      teamId: team.id,
                      userId,
                    }),
                  );
                })
              }
            >
              Rejoindre l’équipe
            </Button>
          )}
          <div className="flex gap-2">
            <SelectField
              aria-label={`Ajouter un membre à ${team.name}`}
              value={selectedUser}
              onValueChange={setSelectedUser}
              disabled={busy}
            >
              {people
                .filter((p) => !members.data?.some((m) => m.userId === p.id))
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectField>
            <Button
              size="sm"
              disabled={busy || !selectedUser}
              onClick={() =>
                void mutate(async () => {
                  authResult(
                    await authClient.organization.addTeamMember({
                      organizationId,
                      teamId: team.id,
                      userId: selectedUser,
                    }),
                  );
                  setSelectedUser("");
                })
              }
            >
              Ajouter
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
