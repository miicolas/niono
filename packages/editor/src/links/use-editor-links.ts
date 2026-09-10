import { useEffect, useRef, useState } from "react";
import { getMarkRange, type Editor } from "@tiptap/react";
import { safeUrl } from "@digipm/contracts";
import type { Transaction } from "@tiptap/pm/state";

type LinkRange = {
  from: number;
  to: number;
  href: string;
  x: number;
  y: number;
  pasted: boolean;
};
export function useEditorLinks(editor: Editor | null) {
  const [link, setLink] = useState<LinkRange | null>(null);
  const tracked = useRef<LinkRange | null>(null);
  const close = () => {
    tracked.current = null;
    setLink(null);
  };
  const open = (value: LinkRange) => {
    tracked.current = value;
    setLink(value);
  };
  useEffect(() => {
    if (!editor) return;
    const map = ({ transaction }: { transaction: Transaction }) => {
      const current = tracked.current;
      if (!current) return;
      if (!editor.isEditable) return close();
      const from = transaction.mapping.map(current.from, 1);
      const to = transaction.mapping.map(current.to, -1);
      if (
        from >= to ||
        (transaction.docChanged &&
          transaction.mapping.maps.some(
            (step) => step.mapResult(current.from).deletedAcross,
          ))
      )
        return close();
      tracked.current = { ...current, from, to };
    };
    editor.on("transaction", map);
    return () => {
      editor.off("transaction", map);
    };
  }, [editor]);
  return {
    link,
    close,
    restoreFocus: () => {
      if (editor && !editor.isDestroyed) editor.commands.focus();
    },
    paste: (event: ClipboardEvent) => {
      if (!editor?.isEditable) return false;
      const text = event.clipboardData?.getData("text/plain").trim() ?? "";
      if (
        !safeUrl(text) ||
        !/^(https?:\/\/|mailto:)/i.test(text) ||
        editor.isActive("codeBlock")
      )
        return false;
      const { from, to, empty } = editor.state.selection;
      event.preventDefault();
      close();
      if (!empty) {
        editor.chain().setLink({ href: text }).run();
        return true;
      }
      editor.commands.insertContent({
        type: "text",
        text,
        marks: [{ type: "link", attrs: { href: text } }],
      });
      const coords = editor.view.coordsAtPos(from);
      open({
        from,
        to: from + text.length,
        href: text,
        x: Math.max(8, Math.min(coords.left, window.innerWidth - 320)),
        y: Math.max(8, Math.min(coords.bottom + 8, window.innerHeight - 280)),
        pasted: true,
      });
      return true;
    },
    click: (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !editor?.isEditable ||
        !anchor ||
        anchor.hasAttribute("data-mention") ||
        anchor.closest("[data-node-view-wrapper]")
      )
        return false;
      if (event.metaKey || event.ctrlKey) return false;
      const pos = editor.view.posAtDOM(anchor, 0);
      const range = getMarkRange(
        editor.state.doc.resolve(pos),
        editor.schema.marks.link!,
      );
      if (!range) return false;
      event.preventDefault();
      const coords = anchor.getBoundingClientRect();
      open({
        ...range,
        href: anchor.getAttribute("href") || "",
        x: Math.max(8, Math.min(coords.left, window.innerWidth - 320)),
        y: Math.max(8, Math.min(coords.bottom + 8, window.innerHeight - 280)),
        pasted: false,
      });
      return true;
    },
    apply: (
      kind: "link" | "bookmark" | "image" | "plain",
      href = tracked.current?.href ?? "",
    ) => {
      const current = tracked.current;
      if (!editor?.isEditable || !current || !safeUrl(href)) return;
      close();
      const range = { from: current.from, to: current.to };
      if (kind === "bookmark" || kind === "image") {
        if (!/^https?:\/\//i.test(href)) return;
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: kind,
            attrs: kind === "image" ? { src: href } : { href },
          })
          .run();
      } else {
        const chain = editor.chain().focus().setTextSelection(range);
        if (kind === "plain") chain.unsetLink().run();
        else chain.setLink({ href }).run();
      }
    },
  };
}
