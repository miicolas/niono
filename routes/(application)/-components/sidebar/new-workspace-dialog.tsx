import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
export function NewWorkspaceDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onCreate(name);
    onOpenChange(false);
    setName("");
  };
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Un nouvel espace</DialogTitle>
          <DialogDescription>
            Pour un projet, une équipe ou simplement vous.
          </DialogDescription>
        </DialogHeader>
        <form className="panel-form" onSubmit={submit}>
          <Input
            aria-label="Nom de l’espace"
            autoFocus
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="Le nom de votre espace"
            required
            value={name}
          />
          <Button type="submit">Créer l’espace</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
