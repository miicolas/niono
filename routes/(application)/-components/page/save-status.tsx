import { Check, Loader2 } from "lucide-react";
import { SAVE_STATUS_LABELS } from "@/routes/(application)/-lib/save-status-labels";
import type { DocumentSaveStatus } from "@/routes/(application)/-lib/use-document-save";

type Props = { status: DocumentSaveStatus };

function StatusIcon({ status }: Props) {
  if (status === "saving") {
    return <Loader2 className="animate-spin" size={12} />;
  }
  if (status === "saved") {
    return <Check size={12} />;
  }
  return null;
}

export function SaveStatus({ status }: Props) {
  const failed = status === "conflict" || status === "error";
  return (
    <output className={`save-status ${failed ? "error" : ""}`}>
      <StatusIcon status={status} />
      {SAVE_STATUS_LABELS[status]}
    </output>
  );
}
