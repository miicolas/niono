import type { PropertyType } from "@/validators/databases";
export const propertyTypeLabels: Record<PropertyType, string> = {
  text: "Texte",
  number: "Nombre",
  checkbox: "Case à cocher",
  select: "Sélection",
  multiSelect: "Sélection multiple",
  status: "Statut",
  date: "Date",
  person: "Personnes",
  url: "URL",
  email: "Email",
  files: "Fichiers",
};
