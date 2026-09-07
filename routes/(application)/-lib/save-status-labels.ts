import type { DocumentSaveStatus } from "./use-document-save";
/** Libellé affiché dans la barre d'outils pour chaque état de sauvegarde. */
export const SAVE_STATUS_LABELS: Record<DocumentSaveStatus, string> = {
  saved: "Enregistré",
  dirty: "Modifications…",
  saving: "Enregistrement…",
  error: "Hors ligne · brouillon local",
  conflict: "Conflit à résoudre",
};
