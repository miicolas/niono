import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  /** `leave` vaut `true` pour quitter avec le brouillon local, `false` pour rester. */
  onDecide: (leave: boolean) => void;
};

export function LeaveConfirmDialog({ open, onDecide }: Props) {
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onDecide(false);
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Votre brouillon n’est pas encore enregistré</DialogTitle>
          <DialogDescription>
            Vous pouvez rester pour réessayer, ou changer de page en conservant
            le brouillon sur cet appareil.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onDecide(false)}>Rester sur cette page</Button>
        <Button onClick={() => onDecide(true)} variant="outline">
          Continuer avec le brouillon local
        </Button>
      </DialogContent>
    </Dialog>
  );
}
