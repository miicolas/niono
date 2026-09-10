import { type PropertyType } from "@digipm/contracts";

export function filterOperators(type: PropertyType | "title") {
  const common = [
    { id: "eq", name: "est égal à" },
    { id: "neq", name: "est différent de" },
  ];
  const empty = [
    { id: "empty", name: "est vide" },
    { id: "notEmpty", name: "n’est pas vide" },
  ];
  if (["number", "date"].includes(type))
    return [
      ...common,
      { id: "gt", name: type === "date" ? "est après" : "est supérieur à" },
      {
        id: "gte",
        name: type === "date" ? "est à partir du" : "est supérieur ou égal à",
      },
      { id: "lt", name: type === "date" ? "est avant" : "est inférieur à" },
      {
        id: "lte",
        name:
          type === "date" ? "est au plus tard le" : "est inférieur ou égal à",
      },
      ...empty,
    ];
  if (["checkbox", "select", "status"].includes(type))
    return [...common, ...empty];
  const contains = [
    { id: "contains", name: "contient" },
    { id: "notContains", name: "ne contient pas" },
  ];
  if (["multiSelect", "person", "files"].includes(type))
    return [...contains, ...empty];
  return [
    ...contains,
    ...common,
    { id: "startsWith", name: "commence par" },
    { id: "endsWith", name: "se termine par" },
    ...empty,
  ];
}
