import { indexPropertyValues } from "../../packages/server/src/databases/index-property-values";
import { rows, values } from "./property-values-fixture";

export function indexedPropertyRows() {
  const byPage = indexPropertyValues(values);
  return rows.map((row) => ({ ...row, values: byPage.get(row.id) ?? {} }));
}
