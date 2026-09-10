import { authClient, authResult } from "@/lib/auth-client";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  editor: "Éditeur",
  viewer: "Lecteur",
};

export function OrganizationMemberRow({
  member,
  organizationId,
  canManage,
  busy,
  mutate,
}: {
  member: { id: string; role: string; user: { name: string; email: string } };
  organizationId: string;
  canManage: boolean;
  busy: boolean;
  mutate: (work: () => Promise<unknown>, message?: string) => Promise<void>;
}) {
  return (
    <div className="settings-row">
      <span>
        <strong className="font-medium">{member.user.name}</strong>
        <p>{member.user.email}</p>
      </span>
      {canManage && !member.role.split(",").includes("owner") ? (
        <SelectField
          aria-label={`Rôle de ${member.user.name}`}
          value={member.role}
          disabled={busy}
          onValueChange={(role) => {
            if (
              role !== "editor" &&
              role !== "viewer" &&
              role !== "admin" &&
              role !== "member" &&
              role !== "remove"
            )
              return;
            void mutate(async () => {
              if (role === "remove")
                authResult(
                  await authClient.organization.removeMember({
                    organizationId,
                    memberIdOrEmail: member.id,
                  }),
                );
              else
                authResult(
                  await authClient.organization.updateMemberRole({
                    organizationId,
                    memberId: member.id,
                    role,
                  }),
                );
            });
          }}
        >
          <SelectItem value="admin">Administrateur</SelectItem>
          <SelectItem value="member">Membre</SelectItem>
          <SelectItem value="editor">Peut modifier</SelectItem>
          <SelectItem value="viewer">Peut consulter</SelectItem>
          <SelectItem value="remove">Retirer de l’espace</SelectItem>
        </SelectField>
      ) : (
        <span className="muted text-xs">
          {member.role
            .split(",")
            .map((r) => roleLabels[r] ?? r)
            .join(", ")}
        </span>
      )}
    </div>
  );
}
