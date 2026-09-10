import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CodexPanelState } from "./codex-panel-state";

export function CodexHistory({
  id,
  select,
  busy,
  list,
  setPrompt,
  setSettingsOpen,
  input,
  running,
  setDeleteOpen,
}: Pick<
  CodexPanelState,
  | "id"
  | "select"
  | "busy"
  | "list"
  | "setPrompt"
  | "setSettingsOpen"
  | "input"
  | "running"
  | "setDeleteOpen"
>) {
  return (
    <div className="codex-history">
      <MessageSquare size={14} aria-hidden="true" />
      <SelectField
        aria-label="Conversation Codex"
        value={id ?? ""}
        onValueChange={(value) => select(value || null)}
        disabled={busy}
        emptyLabel="Nouvelle conversation"
      >
        {(list.data ?? []).map((conversation) => (
          <SelectItem key={conversation.id} value={conversation.id}>
            {conversation.title}
          </SelectItem>
        ))}
      </SelectField>
      <Button
        size="icon"
        variant="ghost"
        title="Nouvelle conversation"
        aria-label="Nouvelle conversation"
        disabled={busy}
        onClick={() => {
          select(null);
          setPrompt("");
          setSettingsOpen(false);
          input.current?.focus();
        }}
      >
        <Plus size={16} />
      </Button>
      {id && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="Supprimer la conversation"
          disabled={busy || running}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={15} />
        </Button>
      )}
    </div>
  );
}
