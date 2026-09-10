import { useCallback, useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/react";

export function useEditorEditable(editor: Editor) {
  const subscribe = useCallback(
    (notify: () => void) => {
      editor.on("transaction", notify);
      return () => {
        editor.off("transaction", notify);
      };
    },
    [editor],
  );
  return useSyncExternalStore(
    subscribe,
    () => editor.isEditable,
    () => false,
  );
}
