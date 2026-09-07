import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EMOJI_ICONS } from "@/constants/emoji-icons";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Icône personnalisée en cours de saisie. */
  icon: string;
  onIconChange: (icon: string) => void;
  /** Enregistre l'icône ; résout `true` quand elle a été appliquée. */
  onSelect: (icon: string) => Promise<boolean>;
};

export function IconPickerDialog({
  open,
  onClose,
  icon,
  onIconChange,
  onSelect,
}: Props) {
  const apply = async (value: string) => {
    if (await onSelect(value)) {
      onClose();
    }
  };
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Une icône pour votre page</DialogTitle>
          <DialogDescription>
            Choisissez un symbole, ou écrivez le vôtre.
          </DialogDescription>
        </DialogHeader>
        <div className="emoji-grid">
          {EMOJI_ICONS.map((emoji) => (
            <button key={emoji} onClick={() => apply(emoji)} type="button">
              {emoji}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply(icon);
          }}
        >
          <Input
            aria-label="Icône personnalisée"
            maxLength={50}
            onChange={(e) => onIconChange(e.target.value)}
            value={icon}
          />
          <Button>Utiliser</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
