import Papa from "papaparse";
import { download } from "@/lib/ui/download";
import { displayValue } from "./display-value";
import type { Members, Property, Row } from "./types";
export function exportViewCsv(
  rows: Row[],
  properties: Property[],
  members: Members
) {
  const data = rows.map((row) =>
    Object.fromEntries([
      ["Nom", row.title],
      ...properties.map((p) => [
        p.name,
        displayValue(p, row.values[p.id]?.value ?? null, members),
      ]),
    ])
  );
  download(
    "vue.csv",
    Papa.unparse(data, { escapeFormulae: true }),
    "text/csv;charset=utf-8"
  );
}
