import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Search, X, Square, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/api";
import { type CodexPanelState } from "./codex-panel-state";

export function CodexComposer({
  submitComposer,
  pageTitle,
  pageId,
  codex,
  running,
  busy,
  fillPrompt,
  composer,
  input,
  prompt,
  blocked,
  execute,
  id,
  eventQuery,
}: Pick<
  CodexPanelState,
  | "submitComposer"
  | "pageTitle"
  | "pageId"
  | "codex"
  | "running"
  | "busy"
  | "fillPrompt"
  | "composer"
  | "input"
  | "prompt"
  | "blocked"
  | "execute"
  | "id"
  | "eventQuery"
>) {
  return (
    <form
      className="codex-composer"
      onSubmit={(e) => {
        e.preventDefault();
        void submitComposer();
      }}
    >
      <div className="codex-composer-box">
        <div className="codex-context">
          <Badge
            variant="secondary"
            className="codex-context-chip"
            title={pageTitle || "Cet espace"}
          >
            {pageId ? <FileText size={13} /> : <Search size={13} />}
            <span>{pageId ? pageTitle || "Sans titre" : "Cet espace"}</span>
          </Badge>
          {codex.selection && (
            <div className="codex-selection">
              <div>
                <span>Sélection</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer la sélection"
                  onClick={() => codex.setSelection(null)}
                >
                  <X size={13} />
                </Button>
              </div>
              <blockquote>
                {codex.selection.text.slice(0, 220)}
                {codex.selection.text.length > 220 ? "…" : ""}
              </blockquote>
            </div>
          )}
        </div>
        {codex.selection && (
          <div className="codex-presets">
            {[
              "Corriger l’orthographe",
              "Améliorer la clarté",
              "Résumer",
              "Traduire en anglais",
            ].map((label) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                key={label}
                disabled={running || busy}
                onClick={() => fillPrompt(label)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
        <composer.Field name="prompt">
          {(field) => (
            <>
              <Textarea
                name={field.name}
                onBlur={field.handleBlur}
                aria-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                aria-describedby={
                  field.state.meta.errors.length
                    ? "codex-prompt-error"
                    : undefined
                }
                ref={input}
                aria-label="Message à Codex"
                placeholder={
                  codex.selection
                    ? "Que souhaitez-vous changer ?"
                    : "Demandez, imaginez, écrivez…"
                }
                readOnly={busy}
                value={prompt}
                maxLength={12000}
                onChange={(e) => field.handleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    if (!running && !busy && !blocked) void submitComposer();
                  }
                }}
                rows={2}
              />
              <FieldError
                id="codex-prompt-error"
                errors={field.state.meta.errors}
              />
            </>
          )}
        </composer.Field>
        <div className="codex-composer-toolbar">
          <span className="muted text-xs">
            {running
              ? "Vous pouvez arrêter la demande"
              : "Entrée ↵ · Maj + Entrée pour une ligne"}
          </span>
          {running ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Arrêter Codex"
              disabled={busy}
              onClick={() =>
                void execute(async () => {
                  await client.codex.interrupt({ conversationId: id! });
                  await eventQuery.refetch();
                })
              }
            >
              <Square size={14} />
            </Button>
          ) : (
            <Button
              size="icon"
              aria-label="Envoyer à Codex"
              disabled={busy || blocked || !prompt.trim()}
            >
              {busy ? (
                <Spinner className="animate-spin" />
              ) : (
                <ArrowUp size={17} />
              )}
            </Button>
          )}
        </div>
      </div>
      <p className="codex-composer-note">
        Les modifications vous sont proposées avant application.
      </p>
    </form>
  );
}
