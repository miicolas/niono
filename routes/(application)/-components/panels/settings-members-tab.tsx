import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import { InviteMemberForm } from "./invite-member-form";

type Member = Awaited<ReturnType<typeof orpcClient.workspaces.members>>[number];
type Role = "editor" | "viewer" | "remove";
function roleLabel(role: string) {
  if (role === "owner") {
    return "Propriétaire";
  }
  if (role === "editor") {
    return "Éditeur";
  }
  return "Lecteur";
}
export function SettingsMembersTab({
  workspaceId,
  members,
  isOwner,
  onChanged,
}: {
  workspaceId: string;
  members: Member[];
  isOwner: boolean;
  onChanged: () => Promise<void>;
}) {
  const setRole = async (memberId: string, role: Role) => {
    try {
      await orpcClient.workspaces.role({ workspaceId, memberId, role });
      await onChanged();
    } catch (error) {
      reportError(error);
    }
  };
  return (
    <>
      <div>
        {members.map((member) => (
          <div className="settings-row" key={member.id}>
            <span>
              <strong className="font-medium">{member.name}</strong>
              <p>{member.email}</p>
            </span>
            {isOwner && member.role !== "owner" ? (
              <select
                aria-label={`Rôle de ${member.name}`}
                onChange={(e) => setRole(member.id, e.target.value as Role)}
                value={member.role}
              >
                <option value="editor">Peut modifier</option>
                <option value="viewer">Peut consulter</option>
                <option value="remove">Retirer de l’espace</option>
              </select>
            ) : (
              <span className="muted text-xs">{roleLabel(member.role)}</span>
            )}
          </div>
        ))}
      </div>
      {isOwner && <InviteMemberForm workspaceId={workspaceId} />}
    </>
  );
}
