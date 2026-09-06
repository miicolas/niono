import type { PropertyValue } from "@/validators/contracts";
import type { Members, Property } from "./types";
export function displayValue(
  property: Property,
  value: PropertyValue,
  members: Members
) {
  if (value === null) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "✓" : "";
  }
  if (Array.isArray(value)) {
    return value
      .map((id) =>
        property.type === "person"
          ? (members.find((m) => m.id === id)?.name ?? id)
          : (property.options.find((o) => o.id === id)?.name ?? id)
      )
      .join(", ");
  }
  return property.options.find((o) => o.id === value)?.name ?? String(value);
}
