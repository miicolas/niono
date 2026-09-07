import type { Editor } from "@tiptap/react";
import type { UploadedAsset } from "@/features/editor/upload";
import {
  addPlaceholder,
  placeholderPos,
  removePlaceholder,
} from "../extensions/upload-placeholder";
import { assetNode } from "./asset-node";
import { uploadLabel } from "./upload-label";

export type InsertUploadsOptions = {
  /** Position d'insertion ; par défaut, là où se trouve le curseur. */
  at?: number;
  upload: (file: File) => Promise<UploadedAsset>;
  onError?: (message: string) => void;
};

const previewUrl = (file: File | undefined) =>
  file?.type.startsWith("image/") ? URL.createObjectURL(file) : null;

const reason = (error: unknown) =>
  error instanceof Error ? error.message : "Import impossible.";

/**
 * Envoie des fichiers puis les insère dans la page. Un aperçu tient la place
 * pendant l'envoi et suit les modifications faites entre-temps, si bien que les
 * blocs arrivent là où ils étaient attendus même après avoir continué à écrire.
 */
export async function insertUploads(
  editor: Editor,
  files: File[],
  { at, upload, onError }: InsertUploadsOptions
) {
  if (!files.length) {
    return;
  }
  const id = crypto.randomUUID();
  const preview = previewUrl(files[0]);
  editor.view.dispatch(
    addPlaceholder(editor.state, {
      id,
      pos: at ?? editor.state.selection.to,
      preview,
      label: uploadLabel(files),
    })
  );
  const results = await Promise.allSettled(files.map(upload));
  if (preview) {
    URL.revokeObjectURL(preview);
  }
  if (editor.isDestroyed) {
    return;
  }
  const target = placeholderPos(editor.state, id);
  editor.view.dispatch(removePlaceholder(editor.state, id));
  for (const result of results) {
    if (result.status === "rejected") {
      onError?.(reason(result.reason));
    }
  }
  const nodes = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => assetNode(result.value));
  if (target === null || !nodes.length) {
    return;
  }
  editor.chain().insertContentAt(target, nodes).focus().run();
}
