import { changeMedia } from "./change-media";
import { useEffect, useRef, useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import type { UploadHandler } from "./media-types";

export function useMediaUpload(props: NodeViewProps, onUpload: UploadHandler) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  return {
    busy,
    error,
    cancel: () => {
      pending.current?.abort();
      pending.current = null;
      setBusy(false);
    },
    upload: async (file: File) => {
      if (!props.editor.isEditable || busy) return;
      if (props.node.type.name === "image" && !file.type.startsWith("image/")) {
        setError("Choisissez une image PNG, JPEG, GIF ou WebP.");
        return;
      }
      const request = new AbortController();
      pending.current = request;
      setBusy(true);
      setError(null);
      try {
        const result = await onUpload(file, request.signal);
        if (
          request.signal.aborted ||
          props.editor.isDestroyed ||
          !props.editor.isEditable ||
          props.getPos() === undefined
        )
          return;
        if (
          props.node.type.name === "image" &&
          !result.mime.startsWith("image/")
        )
          throw new Error(
            "Ce format d’image n’est pas pris en charge. Ajoutez-le comme fichier.",
          );
        changeMedia(props.editor, () =>
          props.updateAttributes({
            [props.node.type.name === "image" ? "src" : "href"]: result.url,
            name: result.name,
            size: result.size ?? file.size,
          }),
        );
      } catch (cause) {
        if (!request.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Envoi impossible. Réessayez.",
          );
      } finally {
        if (pending.current === request && !request.signal.aborted) {
          setBusy(false);
          pending.current = null;
        }
      }
    },
  };
}
