export type PageTemplate = {
  icon: string;
  title: string;
  description: string;
  sections: string[];
};
export const templates: PageTemplate[] = [
  {
    icon: "🗓️",
    title: "Notes de réunion",
    description: "Un ordre du jour, des décisions et une suite claire.",
    sections: [
      "Ordre du jour",
      "Notes & discussions",
      "Décisions",
      "Prochaines étapes",
    ],
  },
  {
    icon: "🚀",
    title: "Brief de projet",
    description: "Une direction commune pour votre prochain projet.",
    sections: ["Contexte", "Objectifs", "Livrables", "Étapes & calendrier"],
  },
  {
    icon: "🌿",
    title: "Journal personnel",
    description: "Prenez le temps de poser vos idées.",
    sections: ["Aujourd’hui", "Ce que j’ai appris", "Une idée pour demain"],
  },
  {
    icon: "📚",
    title: "Wiki d’équipe",
    description: "Tout ce que votre équipe a besoin de retrouver.",
    sections: ["Bienvenue", "Notre façon de travailler", "Ressources utiles"],
  },
];
