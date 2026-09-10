import type { MentionItem } from "./mention-types";
import { normalizeSearch } from "../document-editor/normalize-search";

export function dateMentions(query: string, now = new Date()): MentionItem[] {
  const terms = [
    { offset: 0, label: "Aujourd’hui" },
    { offset: 1, label: "Demain" },
    { offset: -1, label: "Hier" },
  ];
  const items = terms
    .filter((term) =>
      normalizeSearch(term.label).includes(
        normalizeSearch(query).replace(/'/g, "’"),
      ),
    )
    .map((term) => {
      const date = new Date(now);
      date.setDate(date.getDate() + term.offset);
      const referenceId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return {
        kind: "date" as const,
        referenceId,
        label: `${term.label} · ${date.toLocaleDateString("fr-FR")}`,
        workspaceId: "",
      };
    });
  if (/^\d{4}-\d{2}-\d{2}$/.test(query) && !Number.isNaN(Date.parse(query))) {
    const date = new Date(`${query}T12:00:00`);
    if (date.toISOString().slice(0, 10) === query)
      items.push({
        kind: "date",
        referenceId: query,
        label: date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        workspaceId: "",
      });
  }
  return items;
}
