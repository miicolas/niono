import { validatePropertyValue } from "@/lib/databases/validate-property-value";
import { emptyDocument } from "@/lib/editor/empty-document";
import { defaultViewConfig, type PropertyType } from "@/validators/databases";
import { type Archive, emptyArchive } from "@/validators/transfer";
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
type Property = Archive["properties"][number];
const TRUTHY = /^(true|1|oui|yes)$/i;
const BOOLEAN = /^(true|false|0|1|oui|non|yes|no)$/i;
function cellValue(
  property: Property,
  raw: string
): string | number | boolean | null {
  if (raw === "") {
    return null;
  }
  if (property.type === "number") {
    return Number(raw);
  }
  if (property.type === "checkbox") {
    return TRUTHY.test(raw);
  }
  if (property.type === "select") {
    return property.options.find((o) => o.name === raw)?.id ?? null;
  }
  return raw;
}
function isValidCell(
  property: Property,
  raw: string,
  value: string | number | boolean | null
) {
  if (!validatePropertyValue(property.type, value, property.options)) {
    return false;
  }
  return !(property.type === "checkbox" && raw !== "" && !BOOLEAN.test(raw));
}
function csvProperties(data: Csv, sourceId: string): Property[] {
  return data.headers.slice(1).map((name, i) => {
    const type = data.types[i + 1] ?? "text";
    const names =
      type === "select"
        ? [
            ...new Set(
              data.rows.map((row) => row[i + 1]).filter((v): v is string => !!v)
            ),
          ]
        : [];
    return {
      id: crypto.randomUUID(),
      sourceId,
      name,
      type,
      options: names.map((name) => ({
        id: crypto.randomUUID(),
        name,
        color: "gray",
      })),
    };
  });
}
export function csvArchive(data: Csv, name: string): Archive {
  const pageId = crypto.randomUUID();
  const sourceId = crypto.randomUUID();
  const properties = csvProperties(data, sourceId);
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
      const value = cellValue(p, raw);
      if (!isValidCell(p, raw, value)) {
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
