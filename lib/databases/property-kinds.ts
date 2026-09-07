import type { FilterOperator, PropertyType } from "@/validators/databases";

export function isMultiValued(type: PropertyType): boolean {
  return type === "multiSelect" || type === "person" || type === "files";
}

export function isChoiceType(type: PropertyType): boolean {
  return type === "select" || type === "status";
}

/** Opérateurs de filtre autorisés pour un type de propriété. */
export function filterOperatorsFor(type: PropertyType): FilterOperator[] {
  if (isMultiValued(type)) {
    return ["contains", "eq", "neq", "empty"];
  }
  if (type === "checkbox" || isChoiceType(type)) {
    return ["eq", "neq", "empty"];
  }
  if (type === "number" || type === "date") {
    return ["eq", "neq", "gt", "lt", "empty"];
  }
  return ["contains", "eq", "neq", "empty"];
}
