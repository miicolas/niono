import { useState } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import type {
  ShareGrant,
  WorkspaceMembers,
} from "@/routes/(application)/-lib/types";

type Props = {
  pageId: string;
  isPrivate: boolean;
  grants: ShareGrant[];
  members: WorkspaceMembers;
  onDone: () => Promise<void>;
};

export function ShareForm({
  pageId,
  isPrivate,
  members,
  grants,
  onDone,
}: Props) {
  const [privateRoot, setPrivateRoot] = useState(isPrivate);
  return (
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const grants = members.flatMap<ShareGrant>((member) => {
          const value = form.get(member.id);
          return value === "editor" || value === "viewer"
            ? [{ userId: member.id, role: value }]
            : [];
        });
        try {
          await orpcClient.pages.share({ pageId, privateRoot, grants });
          await onDone();
        } catch (error) {
          reportError(error);
        }
      }}
    >
      <label>
        <select
          aria-label="Accès à la page"
          onChange={(e) => setPrivateRoot(e.target.value === "private")}
          value={privateRoot ? "private" : "workspace"}
        >
          <option value="workspace">Membres de l’espace</option>
          <option value="private">Page privée</option>
        </select>
      </label>
      {privateRoot && (
        <>
          <p className="muted text-xs">
            Définissez les accès à enregistrer. Le créateur conserve ses droits.
          </p>
          {members.map((member) => (
            <label className="settings-row" key={member.id}>
              <span>{member.name}</span>
              <select
                aria-label={`Accès de ${member.name}`}
                defaultValue={
                  grants.find((g) => g.userId === member.id)?.role ?? "none"
                }
                name={member.id}
              >
                <option value="none">Aucun</option>
                <option value="viewer">Lecture</option>
                <option value="editor">Modification</option>
              </select>
            </label>
          ))}
        </>
      )}
      <Button>Enregistrer les accès</Button>
    </form>
  );
}
