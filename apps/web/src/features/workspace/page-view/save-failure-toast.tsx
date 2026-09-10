import { useEffect, useId, useRef, type ReactNode } from "react";
import { useDocumentSave } from "@/features/editor/use-document-save";
import { toast } from "sonner";

export function SaveFailureToast({
  status,
  children,
}: {
  status: ReturnType<typeof useDocumentSave>["status"];
  children: ReactNode;
}) {
  const id = useId();
  const hasFailure = useRef(false);

  useEffect(() => {
    if (status === "saved") {
      hasFailure.current = false;
      toast.dismiss(id);
      return;
    }
    if (status === "error" || status === "conflict") hasFailure.current = true;
    if (!hasFailure.current) return;

    toast.warning(
      status === "conflict"
        ? "Conflit de sauvegarde"
        : "Modifications non enregistrées",
      {
        id,
        description: children,
        duration: Infinity,
        dismissible: false,
        closeButton: false,
        position: "bottom-right",
      },
    );
  }, [children, id, status]);

  useEffect(
    () => () => {
      toast.dismiss(id);
    },
    [id],
  );

  return null;
}
