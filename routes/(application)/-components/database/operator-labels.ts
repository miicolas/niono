import type { FilterOperator } from "@/validators/databases";
export const operatorLabels: Record<FilterOperator, string> = {
  contains: "contient",
  eq: "est égal à",
  neq: "différent de",
  gt: "supérieur à",
  lt: "inférieur à",
  empty: "est vide",
};
