import { ORPCError } from "@orpc/server";
import { type SQL, sql } from "drizzle-orm";
import type { PropertyDefinition } from "@/db/schema/databases/types";
import { isChoiceType } from "@/lib/databases/property-kinds";
import { validatePropertyValue } from "@/lib/databases/validate-property-value";
import { propertyExpression } from "./property-expression";

export type EntryScope =
  | { propertyId: string; value: string | null }
  | { propertyId: string; from: string; to: string };

/** Restreint la requête à une colonne de tableau (choix) ou à une plage de dates (calendrier). */
export function compileScope(
  properties: PropertyDefinition[],
  scope: EntryScope | undefined
): SQL | undefined {
  if (!scope) {
    return;
  }
  const property = properties.find((p) => p.id === scope.propertyId);
  if (!property) {
    throw new ORPCError("BAD_REQUEST");
  }
  const e = propertyExpression(properties, property.id);
  if ("value" in scope) {
    if (!isChoiceType(property.type)) {
      throw new ORPCError("BAD_REQUEST");
    }
    return scope.value === null
      ? sql`${e} IS NULL`
      : sql`${e} = ${scope.value}`;
  }
  if (
    property.type !== "date" ||
    !validatePropertyValue("date", scope.from) ||
    !validatePropertyValue("date", scope.to) ||
    scope.from > scope.to
  ) {
    throw new ORPCError("BAD_REQUEST");
  }
  return sql`${e} >= ${scope.from} AND ${e} <= ${scope.to}`;
}
