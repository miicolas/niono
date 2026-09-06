import type { schema as s } from "@/db";
import type { PropertyValue } from "@/validators/contracts";
export function valueFrom(row: typeof s.values.$inferSelect): PropertyValue {
  return (
    row.textValue ?? row.numberValue ?? row.boolValue ?? row.arrayValue ?? null
  );
}
export function valueColumns(value: PropertyValue) {
  return {
    textValue: typeof value === "string" ? value : null,
    numberValue: typeof value === "number" ? value : null,
    boolValue: typeof value === "boolean" ? value : null,
    arrayValue: Array.isArray(value) ? value : null,
  };
}
