import {
  type Archive,
  defaultViewConfig,
  emptyArchive,
  emptyDocument,
  type PropertyType,
  validatePropertyValue,
} from "@/validators/contracts";
export type Csv = {
  headers: string[];
  rows: string[][];
  types: PropertyType[];
};
/** Property types a CSV column can be imported as. */
export const csvPropertyTypes: PropertyType[] = [
  "text",
  "number",
  "checkbox",
  "date",
  "select",
  "email",
  "url",
];
export function csvArchive(data: Csv, name: string): Archive {
  const pageId = crypto.randomUUID(),
    sourceId = crypto.randomUUID();
  const properties = data.headers.slice(1).map((name, i) => ({
    id: crypto.randomUUID(),
    sourceId,
    name,
    type: data.types[i + 1]!,
    options:
      data.types[i + 1] === "select"
        ? [...new Set(data.rows.map((row) => row[i + 1]).filter(Boolean))].map(
            (name) => ({
              id: crypto.randomUUID(),
              name: name!,
              color: "gray",
            })
          )
        : [],
  }));
  const pages: Archive["pages"] = [
    {
      id: pageId,
      parentId: null,
      title: name,
      icon: "▦",
      kind: "database",
      privateRoot: false,
      cover: null,
      content: emptyDocument,
    },
  ];
  const entries: Archive["entries"] = [];
  const values: Archive["values"] = [];
  for (const [index, row] of data.rows.entries()) {
    const id = crypto.randomUUID();
    pages.push({
      id,
      parentId: pageId,
      title: row[0] || "Sans titre",
      icon: "📄",
      kind: "page",
      privateRoot: false,
      cover: null,
      content: emptyDocument,
    });
    entries.push({ pageId: id, sourceId });
    for (const [i, p] of properties.entries()) {
      const raw = row[i + 1] ?? "";
      const value =
        raw === ""
          ? null
          : p.type === "number"
            ? Number(raw)
            : p.type === "checkbox"
              ? /^(true|1|oui|yes)$/i.test(raw)
              : p.type === "select"
                ? (p.options.find((o) => o.name === raw)?.id ?? null)
                : raw;
      if (
        !validatePropertyValue(p.type, value, p.options) ||
        (p.type === "checkbox" &&
          raw !== "" &&
          !/^(true|false|0|1|oui|non|yes|no)$/i.test(raw))
      ) {
        throw new Error(
          `Ligne ${index + 2}, « ${p.name} » : « ${raw} » n’est pas une valeur ${p.type} valide.`
        );
      }
      values.push({ pageId: id, propertyId: p.id, value });
    }
  }
  return {
    ...emptyArchive(),
    pages,
    sources: [{ id: sourceId, pageId }],
    properties,
    entries,
    values,
    views: [{ sourceId, name: "Table", config: defaultViewConfig }],
  };
}
