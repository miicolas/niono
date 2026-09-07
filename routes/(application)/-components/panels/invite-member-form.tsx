import { Mail } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const invite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await orpcClient.workspaces.invite({
        workspaceId,
        email: String(data.get("email")),
        role: data.get("role") === "viewer" ? "viewer" : "editor",
      });
      toast.success("Invitation envoyée");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel-form mt-3" onSubmit={invite}>
      <label htmlFor={id}>
        Inviter un membre
        <Input
          id={id}
          name="email"
          placeholder="personne@exemple.fr"
          required
          type="email"
        />
      </label>
      <select aria-label="Rôle de l’invité" name="role">
        <option value="editor">Peut modifier</option>
        <option value="viewer">Peut consulter</option>
      </select>
      <Button disabled={busy}>
        <Mail size={14} />
        Envoyer l’invitation
      </Button>
    </form>
  );
}
