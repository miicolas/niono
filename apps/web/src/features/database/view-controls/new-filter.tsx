import { type DatabaseProperty, type FilterRule } from "./shared";

export function newFilter(
  id: string,
  properties: DatabaseProperty[],
): FilterRule {
  const property = properties.find((p) => p.id === id);
  const type = property?.type ?? "text";
  return {
    propertyId: id,
    operator: ["text", "url", "email"].includes(type) ? "contains" : "eq",
    value: type === "checkbox" ? "true" : (property?.options[0]?.id ?? ""),
  };
}
