import { useRef, useState, type ReactNode } from "react";
import { type Selection, type EditorBridge, CodexContext } from "./shared";

export function CodexProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const editor = useRef<EditorBridge | null>(null);
  const register = (bridge: EditorBridge) => {
    editor.current = bridge;
    return () => {
      if (editor.current === bridge) editor.current = null;
    };
  };
  return (
    <CodexContext.Provider
      value={{
        open,
        setOpen,
        selection,
        setSelection,
        editor,
        register,
        askSelection: async (input) => {
          if (!editor.current || editor.current.pageId !== input.pageId)
            throw new Error("La page a changé.");
          const revision = await editor.current.prepare();
          setSelection({ ...input, revision });
          setOpen(true);
        },
      }}
    >
      {children}
    </CodexContext.Provider>
  );
}
