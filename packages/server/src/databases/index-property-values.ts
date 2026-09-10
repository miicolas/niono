import type { schema } from "@digipm/db";
import { valueFrom } from "./value-from";

type StoredValue = typeof schema.values.$inferSelect;
type Cell = { value: ReturnType<typeof valueFrom>; revision: number };

export function indexPropertyValues(values: StoredValue[]) {
  const byPage = new Map<string, Record<string, Cell>>();
  for (const value of values) {
    let cells = byPage.get(value.pageId);
    if (!cells) {
      cells = {};
      byPage.set(value.pageId, cells);
    }
    cells[value.propertyId] = {
      value: valueFrom(value),
      revision: value.revision,
    };
  }
  return byPage;
}
