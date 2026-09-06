import { toast } from "sonner";
export function reportError(error: unknown) {
  toast.error(
    error instanceof Error ? error.message : "L’opération a échoué. Réessayez."
  );
}
