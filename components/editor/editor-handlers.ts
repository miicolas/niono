import type { Editor } from "@tiptap/react";

/** Réactions de la page aux événements de l'éditeur, lues via une référence. */
export type EditorHandlers = {
  /** `true` si la touche a été consommée. */
  onKeyDown: (event: KeyboardEvent) => boolean;
  onFiles: (files: File[], at?: number) => void;
  onUpdate: (editor: Editor) => void;
  onSelectionUpdate: (editor: Editor) => void;
};
