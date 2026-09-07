import type { Editor } from "@tiptap/react";
import { useState } from "react";

export type AIRewriteState = {
  text: string;
  from: number;
  to: number;
  instruction: string;
  result: string;
  busy: boolean;
};

export type AIRewriteOptions = {
  editor: Editor | null;
  editable: boolean;
  onAI?: (text: string, instruction: string) => Promise<string>;
  onError?: (message: string) => void;
};

export type AIRewrite = ReturnType<typeof useAIRewrite>;

const DEFAULT_INSTRUCTION = "Améliore la clarté de ce texte.";

const reason = (error: unknown) =>
  error instanceof Error ? error.message : "Assistant indisponible.";

/**
 * Assistant d'écriture sur la sélection : ouverture, instruction, appel du
 * fournisseur, puis remplacement ou insertion du résultat dans la page.
 */
export function useAIRewrite({
  editor,
  editable,
  onAI,
  onError,
}: AIRewriteOptions) {
  const [state, setState] = useState<AIRewriteState | null>(null);
  const patch = (changes: Partial<AIRewriteState>) =>
    setState((current) => current && { ...current, ...changes });

  const open = () => {
    if (!(editor && editable)) {
      return;
    }
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, "\n");
    if (!text.trim()) {
      return;
    }
    setState({
      text,
      from,
      to,
      instruction: DEFAULT_INSTRUCTION,
      result: "",
      busy: false,
    });
  };

  const submit = async () => {
    if (!state) {
      return;
    }
    patch({ busy: true });
    try {
      const result = await onAI?.(state.text, state.instruction);
      patch({ result: result ?? "", busy: false });
    } catch (error) {
      onError?.(reason(error));
      patch({ busy: false });
    }
  };

  const replace = () => {
    if (!(editor && state)) {
      return;
    }
    const current = editor.state.doc.textBetween(state.from, state.to, "\n");
    if (current !== state.text) {
      onError?.("Le texte a changé. Relancez la sélection.");
      return;
    }
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: state.from, to: state.to },
        { type: "text", text: state.result }
      )
      .run();
    setState(null);
  };

  const insertAfter = () => {
    if (!(editor && state)) {
      return;
    }
    const at = editor.state.doc
      .resolve(Math.min(state.to, editor.state.doc.content.size))
      .after(1);
    editor
      .chain()
      .focus()
      .insertContentAt(at, {
        type: "paragraph",
        content: [{ type: "text", text: state.result }],
      })
      .run();
    setState(null);
  };

  return {
    state,
    open,
    close: () => setState(null),
    setInstruction: (instruction: string) => patch({ instruction }),
    submit,
    replace,
    insertAfter,
  };
}
