import * as React from "react";
import { type Editor } from "@tiptap/react";
import {
  Text,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Minus,
  ImageIcon,
  Table2,
  ChevronRight,
  FileUp,
  Info,
  Bookmark,
  AtSign,
} from "lucide-react";
import { newQuestionnaire } from "@digipm/contracts/questionnaire";
import { type Action } from "./shared";

export function createEditorActions(
  uploadInput: React.RefObject<HTMLInputElement | null>,
  QuestionnaireSection: boolean,
): Action[] {
  return [
    {
      id: "text",
      label: "Texte",
      description: "Commencez à écrire en toute simplicité",
      icon: Text,
      run: (e) => e.chain().focus().setParagraph().run(),
    },
    ...([1, 2, 3] as const).map((level) => ({
      id: `h${level}`,
      label: `Titre ${level}`,
      description:
        level === 1
          ? "Un titre de grande taille"
          : level === 2
            ? "Un titre de taille moyenne"
            : "Un petit titre",
      icon: [Heading1, Heading2, Heading3][level - 1]!,
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
    ...(QuestionnaireSection
      ? [
          {
            id: "questionnaire",
            label: "Questionnaire",
            description: "Questions par étapes et récapitulatif des réponses",
            icon: ListTodo,
            run: (e: Editor) =>
              e
                .chain()
                .focus()
                .insertContent([
                  {
                    type: "questionnaire",
                    attrs: { questionnaire: newQuestionnaire() },
                  },
                  { type: "paragraph" },
                ])
                .run(),
          },
        ]
      : []),
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
      description: "Ajoutez une image à votre page",
      icon: ImageIcon,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertContent({ type: "image", attrs: { src: "" } })
          .run(),
    },
    {
      id: "file",
      label: "Fichier",
      description: "Joignez un document",
      icon: FileUp,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertContent({ type: "file", attrs: { href: "" } })
          .run(),
    },
    {
      id: "bookmark",
      label: "Signet web",
      description: "Une carte pour retrouver un lien",
      icon: Bookmark,
      run: (e) =>
        e
          .chain()
          .focus()
          .insertContent({ type: "bookmark", attrs: { href: "" } })
          .run(),
    },
    {
      id: "mention",
      label: "Mention",
      description: "Une page, une personne ou une date",
      icon: AtSign,
      run: (e) => e.chain().focus().insertContent("@").run(),
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
