import { Button } from "@/components/ui/button";

type Props = { onRecover: () => void; onIgnore: () => void };

export function DraftRecoveryBanner({ onRecover, onIgnore }: Props) {
  return (
    <div className="conflict-banner">
      Un brouillon non enregistré a été retrouvé sur cet appareil.
      <div className="actions">
        <Button onClick={onRecover} size="sm">
          Récupérer le brouillon
        </Button>
        <Button onClick={onIgnore} size="sm" variant="outline">
          Ignorer
        </Button>
      </div>
    </div>
  );
}
