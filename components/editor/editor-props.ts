import type { EditorProps } from "@tiptap/pm/view";
import type { RefObject } from "react";
import { draggingFiles } from "@/lib/editor/dragging-files";
import { pasteFiles } from "@/lib/editor/paste-files";
import { transferFiles } from "@/lib/editor/transfer-files";
import type { EditorHandlers } from "./editor-handlers";

/**
 * Propriétés ProseMirror de l'éditeur : attributs d'accessibilité, clavier,
 * collage et dépôt de fichiers. Les réactions passent par `handlers` pour
 * rester à jour sans recréer l'éditeur.
 */
export function createEditorProps(
  handlers: RefObject<EditorHandlers | null>
): EditorProps {
  return {
    attributes: {
      class: "digipm-editor",
      role: "textbox",
      "aria-label": "Contenu de la page",
      "aria-multiline": "true",
    },
    handleKeyDown: (_view, event) =>
      handlers.current?.onKeyDown(event) ?? false,
    handlePaste: (_view, event) => {
      const files = pasteFiles(event.clipboardData);
      if (!files.length) {
        return false;
      }
      event.preventDefault();
      handlers.current?.onFiles(files);
      return true;
    },
    handleDOMEvents: {
      dragstart: (view) => {
        view.dom.classList.add("dragging");
        return false;
      },
      dragend: (view) => {
        view.dom.classList.remove("dragging");
        return false;
      },
      dragover: (view, event) => {
        if (draggingFiles(event.dataTransfer)) {
          view.dom.classList.add("file-over");
        }
        return false;
      },
      dragleave: (view) => {
        view.dom.classList.remove("file-over");
        return false;
      },
    },
    handleDrop: (view, event, _slice, moved) => {
      view.dom.classList.remove("dragging");
      view.dom.classList.remove("file-over");
      const files = transferFiles(event.dataTransfer);
      if (moved || !files.length) {
        return false;
      }
      event.preventDefault();
      const at = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      })?.pos;
      handlers.current?.onFiles(files, at);
      return true;
    },
  };
}
