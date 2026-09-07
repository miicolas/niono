import type { Editor } from "@tiptap/react";
import { useCallback, useRef } from "react";
import type { UploadedAsset } from "@/lib/editor/upload-file";
import { insertUploads } from "./upload/insert-uploads";

export type EditorUploadOptions = {
  editor: Editor | null;
  editable: boolean;
  onUpload: (file: File) => Promise<UploadedAsset>;
  onError?: (message: string) => void;
};

const reason = (error: unknown) =>
  error instanceof Error ? error.message : "Import impossible.";

/**
 * Envoi de fichiers vers la page (collage, dépôt, commandes « Image » et
 * « Fichier ») et références des champs fichier masqués qui les déclenchent.
 */
export function useEditorUpload({
  editor,
  editable,
  onUpload,
  onError,
}: EditorUploadOptions) {
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useCallback(
    (files: File[], at?: number) => {
      if (!(editor && editable)) {
        return;
      }
      insertUploads(editor, files, { at, upload: onUpload, onError }).catch(
        (error: unknown) => onError?.(reason(error))
      );
    },
    [editor, editable, onUpload, onError]
  );
  return {
    upload,
    imageInput,
    fileInput,
    openImagePicker: () => imageInput.current?.click(),
    openFilePicker: () => fileInput.current?.click(),
  };
}
