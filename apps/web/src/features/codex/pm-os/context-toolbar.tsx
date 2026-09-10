import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WorkflowCatalog } from "./workflow-catalog";
import { PmContextForm } from "./context-form";
import { ContextReferences, type PmContext } from "./context-references";
export function ContextToolbar({
  workspaceId,
  context,
  disabled,
  onSubject,
  onWorkflow,
  onRefresh,
}: {
  workspaceId: string;
  context?: PmContext;
  disabled: boolean;
  onSubject: (id: string | null) => void;
  onWorkflow: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"company" | "subject" | "references" | null>(
    null,
  );
  if (!context?.pack) return null;
  const selected = context.selectedSubjectId ?? "workspace";
  return (
    <div className="pm-toolbar">
      <div className="pm-subject-row">
        <Select
          value={selected}
          onValueChange={(value) =>
            onSubject(value === "workspace" ? null : value)
          }
          disabled={disabled}
        >
          <SelectTrigger aria-label="Sujet PM-OS">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="workspace">
              {context.settings?.companyName ?? "Digitevent"} · Transverse
            </SelectItem>
            {context.subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Créer un sujet"
          disabled={disabled || !context.settings}
          onClick={() => setMode("subject")}
        >
          <Plus size={16} />
        </Button>
      </div>
      <div className="pm-toolbar-actions">
        <WorkflowCatalog disabled={disabled} onSelect={onWorkflow} />
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => setMode(context.settings ? "references" : "company")}
        >
          <Settings2 size={14} />{" "}
          {context.settings ? "Contexte" : "Initialiser Digitevent"}
        </Button>
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
      >
        <DialogContent className="pm-context-dialog">
          <DialogHeader>
            <DialogTitle>
              {mode === "subject" ? "Nouveau sujet" : "Contexte PM-OS"}
            </DialogTitle>
            <DialogDescription>
              {mode === "references"
                ? "Entreprise, stratégie, styles et sources du sujet."
                : "DigiPM demandera ensuite seulement les informations nécessaires au travail."}
            </DialogDescription>
          </DialogHeader>
          {mode === "references" ? (
            <ContextReferences
              workspaceId={workspaceId}
              context={context}
              onChange={onRefresh}
            />
          ) : (
            mode && (
              <PmContextForm
                key={mode}
                workspaceId={workspaceId}
                pages={context.pages}
                mode={mode}
                onDone={async (subjectId) => {
                  await onRefresh();
                  if (subjectId) onSubject(subjectId);
                  setMode(null);
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
