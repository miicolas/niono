import { db, schema as s } from "@digipm/db";
import { and, eq, sql, or, type SQL } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  viewSchema,
  validatePropertyValue,
  type ViewConfig,
} from "@digipm/contracts";
import { sourceFor } from "./source-for";
import { validateChart } from "./chart-config";
import { chartGrouping } from "./chart-grouping";

export type EntryQuery = {
  pageId: string;
  config: ViewConfig;
  query?: string;
  scope?:
    | { propertyId: string; value: string | null }
    | { propertyId: string; from: string; to: string };
  chartBucket?: string | null;
};

// Every presentation shares the same search, filters and access predicate.
export async function entryQuery(userId: string, input: EntryQuery) {
  const config = viewSchema.parse(input.config);
  const source = await sourceFor(userId, input.pageId);
  const properties = await db
    .select()
    .from(s.properties)
    .where(eq(s.properties.sourceId, source.id));
  const expr = (id: string): SQL => {
    if (id === "title") return sql`${s.pages.title}`;
    const property = properties.find((p) => p.id === id);
    if (!property)
      throw new ORPCError("BAD_REQUEST", { message: "Propriété inconnue." });
    const column =
      property.type === "number"
        ? sql`pv.number_value`
        : property.type === "checkbox"
          ? sql`pv.bool_value`
          : ["multiSelect", "person", "files"].includes(property.type)
            ? sql`pv.array_value`
            : sql`pv.text_value`;
    return sql`(SELECT ${column} FROM property_values pv WHERE pv.page_id=${s.pages.id} AND pv.property_id=${id})`;
  };
  const filters = config.filters.map((f) => {
    const e = expr(f.propertyId);
    const property = properties.find((p) => p.id === f.propertyId);
    const type = property?.type ?? "text";
    const multiple = ["multiSelect", "person", "files"].includes(type);
    if (f.operator === "empty" || f.operator === "notEmpty") {
      const empty = multiple
        ? sql`coalesce(jsonb_array_length(${e}),0)=0`
        : sql`(${e} IS NULL OR CAST(${e} AS text)='')`;
      return f.operator === "empty" ? empty : sql`NOT (${empty})`;
    }
    const option = property?.options.find(
      (o) =>
        o.id === f.value ||
        o.name.toLocaleLowerCase() === f.value.toLocaleLowerCase(),
    );
    if (multiple) {
      if (!["contains", "notContains", "eq", "neq"].includes(f.operator))
        throw new ORPCError("BAD_REQUEST", {
          message: "Cet opérateur ne convient pas aux valeurs multiples.",
        });
      const member = option?.id ?? f.value;
      return ["neq", "notContains"].includes(f.operator)
        ? sql`NOT coalesce(${e} ? ${member},false)`
        : sql`coalesce(${e} ? ${member},false)`;
    }
    const textOperator = [
      "contains",
      "notContains",
      "startsWith",
      "endsWith",
    ].includes(f.operator);
    const comparison = ["gt", "gte", "lt", "lte"].includes(f.operator);
    if (
      (["checkbox", "select", "status"].includes(type) &&
        !["eq", "neq"].includes(f.operator)) ||
      (["number", "date"].includes(type) && textOperator) ||
      (!["number", "date"].includes(type) && comparison)
    )
      throw new ORPCError("BAD_REQUEST", {
        message: "Cet opérateur ne convient pas au type de la propriété.",
      });
    const value =
      type === "number"
        ? Number(f.value)
        : type === "checkbox"
          ? f.value === "true"
          : (option?.id ?? f.value);
    if (
      (type === "number" && (!f.value.trim() || !Number.isFinite(value))) ||
      (type === "checkbox" && !["true", "false"].includes(f.value)) ||
      (type === "date" && !validatePropertyValue("date", f.value))
    )
      throw new ORPCError("BAD_REQUEST", {
        message: "La valeur du filtre est invalide.",
      });
    if (textOperator) {
      const escaped = f.value.replace(/[%_\\]/g, "\\$&");
      const pattern = `${f.operator === "startsWith" ? "" : "%"}${escaped}${f.operator === "endsWith" ? "" : "%"}`;
      return f.operator === "notContains"
        ? sql`(${e} IS NULL OR CAST(${e} AS text) NOT ILIKE ${pattern})`
        : sql`CAST(${e} AS text) ILIKE ${pattern}`;
    }
    if (f.operator === "eq") return sql`${e} = ${value}`;
    if (f.operator === "neq") return sql`(${e} IS NULL OR ${e} <> ${value})`;
    if (f.operator === "gt") return sql`${e} > ${value}`;
    if (f.operator === "gte") return sql`${e} >= ${value}`;
    if (f.operator === "lte") return sql`${e} <= ${value}`;
    return sql`${e} < ${value}`;
  });
  let scope: SQL | undefined;
  if (input.scope) {
    const property = properties.find((p) => p.id === input.scope!.propertyId);
    if (!property) throw new ORPCError("BAD_REQUEST");
    const e = expr(property.id);
    if ("value" in input.scope) {
      if (!["select", "status"].includes(property.type))
        throw new ORPCError("BAD_REQUEST");
      scope =
        input.scope.value === null
          ? sql`${e} IS NULL`
          : sql`${e} = ${input.scope.value}`;
    } else {
      if (
        property.type !== "date" ||
        !validatePropertyValue("date", input.scope.from) ||
        !validatePropertyValue("date", input.scope.to) ||
        input.scope.from > input.scope.to
      )
        throw new ORPCError("BAD_REQUEST");
      scope = sql`${e} >= ${input.scope.from} AND ${e} <= ${input.scope.to}`;
    }
  }
  const where = and(
    scope,
    input.chartBucket !== undefined
      ? sql`${chartGrouping(validateChart(config, properties), properties, expr)} IS NOT DISTINCT FROM ${input.chartBucket}`
      : undefined,
    eq(s.entries.sourceId, source.id),
    sql`${s.pages.deletedAt} IS NULL`,
    sql`(NOT ${s.pages.privateRoot} OR ${s.pages.createdBy}=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=${s.pages.id} AND g.user_id=${userId}))`,
    input.query
      ? sql`${s.pages.title} ILIKE ${"%" + input.query.replace(/[%_\\]/g, "\\$&") + "%"}`
      : undefined,
    filters.length
      ? config.filterMode === "or"
        ? or(...filters)
        : and(...filters)
      : undefined,
  );
  return { config, properties, expr, where };
}
