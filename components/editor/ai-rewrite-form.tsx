import { ArrowUp, Loader2 } from "lucide-react";
import { AI_PRESETS } from "./ai-presets";
import type { AIRewrite, AIRewriteState } from "./use-ai-rewrite";

export type AIRewriteFormProps = {
  state: AIRewriteState;
  rewrite: AIRewrite;
};

/** Instruction, envoi et application du résultat de l'assistant. */
export function AIRewriteForm({ state, rewrite }: AIRewriteFormProps) {
  return (
    <>
      <div className="ai-presets">
        {AI_PRESETS.map((label) => (
          <button
            key={label}
            onClick={() => rewrite.setInstruction(label)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await rewrite.submit();
        }}
      >
        <input
          aria-label="Instruction pour l’IA"
          onChange={(event) => rewrite.setInstruction(event.target.value)}
          value={state.instruction}
        />
        <button disabled={state.busy} type="submit">
          {state.busy ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <ArrowUp size={16} />
          )}
        </button>
      </form>
      {state.result && (
        <>
          <div className="ai-result">{state.result}</div>
          <div className="ai-result-actions">
            <button onClick={rewrite.replace} type="button">
              Remplacer la sélection
            </button>
            <button onClick={rewrite.insertAfter} type="button">
              Insérer à la suite
            </button>
          </div>
        </>
      )}
    </>
  );
}
