import type { DocumentNode } from "@/lib/editor/document-node";

export const welcomeDocument: DocumentNode = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Un endroit pour vos idées, vos projets et tout ce qui compte.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Faites comme chez vous" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Commencez à écrire, ou tapez / pour ajouter un bloc. Sélectionnez du texte pour le mettre en forme.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Écrire votre première idée" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Créer une page pour votre prochain projet",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Les grandes choses commencent souvent par une simple note.",
            },
          ],
        },
      ],
    },
    { type: "paragraph" },
  ],
};
