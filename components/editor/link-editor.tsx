import type { Editor } from "@tiptap/react";
import { type FormEvent, useState } from "react";

export type LinkEditorProps = {
  editor: Editor;
  onClose: () => void;
  onError?: (message: string) => void;
};

const LINK_PATTERN = /^(https?:\/\/|mailto:)/;

/** Saisie de l'adresse d'un lien sur la sélection ; vide, elle retire le lien. */
export function LinkEditor({ editor, onClose, onError }: LinkEditorProps) {
  const [href, setHref] = useState<string>(
    () => editor.getAttributes("link").href ?? ""
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else if (LINK_PATTERN.test(href)) {
      editor.chain().focus().setLink({ href }).run();
    } else {
      onError?.("Utilisez un lien https://, http:// ou mailto:.");
      return;
    }
    onClose();
  };
  return (
    <form className="bubble-popover" onSubmit={submit}>
      <input
        aria-label="Adresse du lien"
        autoFocus
        onChange={(event) => setHref(event.target.value)}
        placeholder="https://…"
        value={href}
      />
      <button type="submit">Appliquer</button>
    </form>
  );
}
