import { ORPCError } from "@orpc/server";
import { type SQL, sql } from "drizzle-orm";
import { schema as s } from "@/db";
import type { PropertyDefinition } from "@/db/schema/databases/types";
import { isMultiValued } from "@/lib/databases/property-kinds";

function valueColumn(type: PropertyDefinition["type"]): SQL {
  if (type === "number") {
    return sql`pv.number_value`;
  }
  if (type === "checkbox") {
    return sql`pv.bool_value`;
  }
  return isMultiValued(type) ? sql`pv.array_value` : sql`pv.text_value`;
}

/** Expression SQL lisant la valeur d'une propriété (ou le titre) de l'entrée courante. */
export function propertyExpression(
  properties: PropertyDefinition[],
  id: string
): SQL {
  if (id === "title") {
    return sql`${s.pages.title}`;
  }
  const property = properties.find((p) => p.id === id);
  if (!property) {
    throw new ORPCError("BAD_REQUEST", { message: "Propriété inconnue." });
  }
  return sql`(SELECT ${valueColumn(property.type)} FROM property_values pv WHERE pv.page_id=${s.pages.id} AND pv.property_id=${id})`;
}
