import { schema as s } from "@digipm/db";
import { type PropertyValue } from "@digipm/contracts";

export function valueFrom(row: typeof s.values.$inferSelect): PropertyValue {
  return (
    row.textValue ?? row.numberValue ?? row.boolValue ?? row.arrayValue ?? null
  );
}
