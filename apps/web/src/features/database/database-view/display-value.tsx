import { listWorkspacePeople } from "@/lib/organization";
import { type PropertyValue } from "@digipm/contracts";
import { type Property } from "./shared";

export function displayValue(
  property: Property,
  value: PropertyValue,
  members: Awaited<ReturnType<typeof listWorkspacePeople>>,
) {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "✓" : "";
  if (Array.isArray(value))
    return value
      .map((id) =>
        property.type === "person"
          ? (members.find((m) => m.id === id)?.name ?? id)
          : (property.options.find((o) => o.id === id)?.name ?? id),
      )
      .join(", ");
  return property.options.find((o) => o.id === value)?.name ?? String(value);
}
