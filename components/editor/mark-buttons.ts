import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  type LucideIcon,
  Strikethrough,
  Underline,
} from "lucide-react";

export type MarkButton = {
  mark: "bold" | "italic" | "underline" | "strike";
  label: string;
  icon: LucideIcon;
  toggle: (editor: Editor) => void;
};

/** Mises en forme du texte proposées dans la bulle de sélection. */
export const MARK_BUTTONS: MarkButton[] = [
  {
    mark: "bold",
    label: "Gras",
    icon: Bold,
    toggle: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    mark: "italic",
    label: "Italique",
    icon: Italic,
    toggle: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    mark: "underline",
    label: "Souligner",
    icon: Underline,
    toggle: (e) => e.chain().focus().toggleUnderline().run(),
  },
  {
    mark: "strike",
    label: "Barrer",
    icon: Strikethrough,
    toggle: (e) => e.chain().focus().toggleStrike().run(),
  },
];
