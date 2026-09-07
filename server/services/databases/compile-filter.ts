import { ORPCError } from "@orpc/server";
import { type SQL, sql } from "drizzle-orm";
import type { PropertyDefinition } from "@/db/schema/databases/types";
import {
  filterOperatorsFor,
  isMultiValued,
} from "@/lib/databases/property-kinds";
import { validatePropertyValue } from "@/lib/databases/validate-property-value";
import type { ViewConfig } from "@/validators/databases";
import { containsPattern } from "./escape-like";
import { propertyExpression } from "./property-expression";

type Filter = ViewConfig["filters"][number];

function scalarValue(type: PropertyDefinition["type"], filter: Filter) {
  if (type === "number") {
    return Number(filter.value);
  }
  if (type === "checkbox") {
    return filter.value === "true";
  }
  return filter.value;
}

function assertScalarFilter(type: PropertyDefinition["type"], filter: Filter) {
  const value = scalarValue(type, filter);
  if (
    (type === "number" && !(filter.value.trim() && Number.isFinite(value))) ||
    (type === "checkbox" && !["true", "false"].includes(filter.value)) ||
    (type === "date" && !validatePropertyValue("date", filter.value))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "La valeur du filtre est invalide.",
    });
  }
}

function compareExpression(e: SQL, filter: Filter, value: unknown): SQL {
  if (filter.operator === "contains") {
    return sql`CAST(${e} AS text) ILIKE ${containsPattern(filter.value)}`;
  }
  if (filter.operator === "eq") {
    return sql`${e} = ${value}`;
  }
  if (filter.operator === "neq") {
    return sql`(${e} IS NULL OR ${e} <> ${value})`;
  }
  if (filter.operator === "gt") {
    return sql`${e} > ${value}`;
  }
  return sql`${e} < ${value}`;
}

/** Compile un filtre de vue en prédicat SQL paramétré, selon le type de la propriété. */
export function compileFilter(
  properties: PropertyDefinition[],
  filter: Filter
): SQL {
  const e = propertyExpression(properties, filter.propertyId);
  const property = properties.find((p) => p.id === filter.propertyId);
  const type = property?.type ?? "text";
  const multiple = isMultiValued(type);
  if (!filterOperatorsFor(type).includes(filter.operator)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Cet opérateur ne convient pas au type de la propriété.",
    });
  }
  if (filter.operator === "empty") {
    return multiple
      ? sql`coalesce(jsonb_array_length(${e}),0)=0`
      : sql`(${e} IS NULL OR CAST(${e} AS text)='')`;
  }
  const option = property?.options.find(
    (o) =>
      o.id === filter.value ||
      o.name.toLocaleLowerCase() === filter.value.toLocaleLowerCase()
  );
  if (multiple) {
    const member = option?.id ?? filter.value;
    return filter.operator === "neq"
      ? sql`NOT coalesce(${e} ? ${member},false)`
      : sql`coalesce(${e} ? ${member},false)`;
  }
  assertScalarFilter(type, filter);
  const value =
    type === "number" || type === "checkbox"
      ? scalarValue(type, filter)
      : (option?.id ?? filter.value);
  return compareExpression(e, filter, value);
}
