import type { Editor } from "@tiptap/react";
import {
  ChevronRight,
  Code2,
  FileUp,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Info,
  List,
  ListOrdered,
  ListTodo,
  type LucideIcon,
  Minus,
  Quote,
  Table2,
  Text,
} from "lucide-react";

export type SlashAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
};

export type SlashPickers = {
  openImagePicker: () => void;
  openFilePicker: () => void;
};

const HEADINGS = [
  { level: 1, description: "Un titre de grande taille", icon: Heading1 },
  { level: 2, description: "Un titre de taille moyenne", icon: Heading2 },
  { level: 3, description: "Un petit titre", icon: Heading3 },
] as const;

/** Blocs proposés par le menu « / », dans l'ordre d'affichage. */
export function createSlashActions({
  openImagePicker,
  openFilePicker,
}: SlashPickers): SlashAction[] {
  return [
    {
      id: "text",
      label: "Texte",
      description: "Commencez à écrire en toute simplicité",
      icon: Text,
      run: (e) => e.chain().focus().setParagraph().run(),
    },
    ...HEADINGS.map(({ level, description, icon }) => ({
      id: `h${level}`,
      label: `Titre ${level}`,
      description,
      icon,
      run: (e: Editor) => e.chain().focus().setHeading({ level }).run(),
    })),
    {
      id: "bullet",
      label: "Liste à puces",
      description: "Une liste simple et organisée",
      icon: List,
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      id: "ordered",
      label: "Liste numérotée",
      description: "Des étapes dans le bon ordre",
      icon: ListOrdered,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
    {
      id: "task",
      label: "Liste de tâches",
      description: "Suivez ce qui reste à faire",
      icon: ListTodo,
      run: (e) => e.chain().focus().toggleTaskList().run(),
    },
    {
      id: "toggle",
      label: "Liste dépliante",
      description: "Du contenu à ouvrir à votre rythme",
      icon: ChevronRight,
      run: (e) => e.chain().focus().setDetails().run(),
    },
    {
      id: "quote",
      label: "Citation",
      description: "Mettez des mots en lumière",
      icon: Quote,
      run: (e) => e.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "callout",
      label: "Encadré",
      description: "Faites ressortir une information",
      icon: Info,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertContent({ type: "callout", content: [{ type: "paragraph" }] })
          .run(),
    },
    {
      id: "code",
      label: "Code",
      description: "Un extrait de code bien présenté",
      icon: Code2,
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: "table",
      label: "Tableau simple",
      description: "Organisez vos informations en cellules",
      icon: Table2,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      id: "image",
      label: "Image",
      description: "Ajoutez une ou plusieurs images à votre page",
      icon: ImageIcon,
      run: openImagePicker,
    },
    {
      id: "file",
      label: "Fichier",
      description: "Joignez un document",
      icon: FileUp,
      run: openFilePicker,
    },
    {
      id: "divider",
      label: "Séparateur",
      description: "Séparez les sections de votre page",
      icon: Minus,
      run: (e) => e.chain().focus().setHorizontalRule().run(),
    },
  ];
}
