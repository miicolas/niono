import type { Editor } from "@tiptap/react";
import type { RefObject } from "react";
import { reportError } from "@/lib/ui/notifications";
import { exportArchive } from "./export-archive";
import { exportMarkdown } from "./export-markdown";
import { exportPageJson } from "./export-page-json";

type Input = {
  pageId: string;
  title: string;
  icon: string;
  /** Contenu enregistré, utilisé si l'éditeur n'est pas encore prêt. */
  content: unknown;
  editorRef: RefObject<Editor | null>;
  /** Vide les modifications en attente ou lève l'erreur `message`. */
  ensureSaved: (message: string) => Promise<void>;
};

/** Gestionnaires des trois exports du menu d'actions de la page. */
export function pageExportHandlers({
  pageId,
  title,
  icon,
  content,
  editorRef,
  ensureSaved,
}: Input) {
  const archive = async () => {
    try {
      await ensureSaved(
        "Enregistrez ou résolvez le conflit avant d’exporter l’archive."
      );
      await exportArchive(pageId, title);
    } catch (error) {
      reportError(error);
    }
  };
  return {
    onExportArchive: () => archive(),
    onExportMarkdown: () => {
      try {
        exportMarkdown(title, editorRef.current?.getHTML() ?? "");
      } catch (error) {
        reportError(error);
      }
    },
    onExportJson: () =>
      exportPageJson(title, icon, editorRef.current?.getJSON() ?? content),
  };
}
