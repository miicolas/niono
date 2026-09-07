import type { RefObject } from "react";

export type UploadInputProps = {
  accept?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
};

/** Champ fichier masqué, ouvert par les commandes « Image » et « Fichier ». */
export function UploadInput({ accept, inputRef, onFiles }: UploadInputProps) {
  return (
    <input
      accept={accept}
      hidden
      multiple
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length) {
          onFiles(files);
        }
      }}
      ref={inputRef}
      type="file"
    />
  );
}
