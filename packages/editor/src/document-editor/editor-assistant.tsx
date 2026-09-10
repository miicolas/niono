import { useEditorUI } from "./use-editor-ui";
import { type EditorController } from "./shared";

export function EditorAssistant({
  ai,
  AssistantDialog,
  setAI,
  editor,
  aiAvailable,
  onAI,
  onError,
  Input,
}: Pick<
  EditorController,
  | "ai"
  | "AssistantDialog"
  | "setAI"
  | "editor"
  | "aiAvailable"
  | "onAI"
  | "onError"
  | "Input"
>) {
  const { Button, Toggle, Separator, Spinner, Popover, TextForm } =
    useEditorUI();
  return (
    ai && (
      <AssistantDialog
        onClose={() => setAI(null)}
        onRestoreFocus={() => {
          if (!editor.isDestroyed) editor.commands.focus();
        }}
      >
        {!aiAvailable ? (
          <p>
            Pour activer l’assistant, configurez un fournisseur IA dans les
            paramètres du serveur. Votre texte reste sur votre appareil tant que
            vous ne lancez pas une demande.
          </p>
        ) : (
          <>
            <div className="ai-presets">
              {[
                "Améliorer la clarté",
                "Corriger l’orthographe",
                "Résumer",
                "Traduire en anglais",
              ].map((label) => (
                <Button
                  key={label}
                  onClick={() => setAI({ ...ai, instruction: label })}
                >
                  {label}
                </Button>
              ))}
            </div>
            <TextForm
              kind="instruction"
              key={ai.instruction}
              value={ai.instruction}
              onSubmit={async (instruction) => {
                const request = { ...ai, instruction, busy: true };
                setAI(request);
                try {
                  const result = await onAI?.(ai.text, instruction);
                  setAI((current) =>
                    current === request
                      ? { ...current, result: result ?? "", busy: false }
                      : current,
                  );
                } catch (error) {
                  onError?.(
                    error instanceof Error
                      ? error.message
                      : "Assistant indisponible.",
                  );
                  setAI((current) =>
                    current === request ? { ...current, busy: false } : current,
                  );
                }
              }}
            />
            {ai.result && (
              <>
                <div className="ai-result">{ai.result}</div>
                <div className="ai-result-actions">
                  <Button
                    onClick={() => {
                      const current = editor.state.doc.textBetween(
                        ai.from,
                        ai.to,
                        "\n",
                      );
                      if (current !== ai.text) {
                        onError?.("Le texte a changé. Relancez la sélection.");
                        return;
                      }
                      editor
                        .chain()
                        .focus()
                        .insertContentAt(
                          { from: ai.from, to: ai.to },
                          { type: "text", text: ai.result },
                        )
                        .run();
                      setAI(null);
                    }}
                  >
                    Remplacer la sélection
                  </Button>
                  <Button
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .insertContentAt(
                          editor.state.doc
                            .resolve(
                              Math.min(ai.to, editor.state.doc.content.size),
                            )
                            .after(1),
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: ai.result }],
                          },
                        )
                        .run();
                      setAI(null);
                    }}
                  >
                    Insérer à la suite
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </AssistantDialog>
    )
  );
}
