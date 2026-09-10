import { useContext } from "react";
import { EditorUIContext } from "./editor-ui";
export function useEditorUI() {
  const ui = useContext(EditorUIContext);
  if (!ui) throw new Error("DocumentEditor requires its UI provider.");
  return ui;
}
