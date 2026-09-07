import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { schema as s } from "@/db";
import { validatePropertyValue } from "@/lib/databases/validate-property-value";
import { missing } from "@/server/services/access/errors";
import { withPage } from "@/server/services/access/with-page";
import type { PropertyValue } from "@/validators/databases";
import { assertValueReferences } from "./assert-value-references";
import { valueColumns } from "./property-values";

/** Met à jour la valeur d'une cellule si sa révision est courante. */
export function updateCell(
  userId: string,
  input: {
    pageId: string;
    propertyId: string;
    value: PropertyValue;
    expectedRevision: number;
  }
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [entry] = await tx
      .select()
      .from(s.entries)
      .where(eq(s.entries.pageId, input.pageId));
    if (!entry) {
      throw missing();
    }
    const [property] = await tx
      .select()
      .from(s.properties)
      .where(
        and(
          eq(s.properties.id, input.propertyId),
          eq(s.properties.sourceId, entry.sourceId)
        )
      )
      .for("update");
    if (!property) {
      throw missing();
    }
    if (!validatePropertyValue(property.type, input.value, property.options)) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Valeur incompatible avec cette propriété.",
      });
    }
    await assertValueReferences(
      tx,
      userId,
      input.pageId,
      property,
      input.value
    );
    const [old] = await tx
      .select()
      .from(s.values)
      .where(
        and(
          eq(s.values.pageId, input.pageId),
          eq(s.values.propertyId, input.propertyId)
        )
      );
    if ((old?.revision ?? 0) !== input.expectedRevision) {
      throw new ORPCError("CONFLICT", {
        message: "Cette cellule a été modifiée ailleurs.",
      });
    }
    const value = input.value;
    const revision = (old?.revision ?? 0) + 1;
    const fields = { ...valueColumns(value), revision };
    await tx
      .insert(s.values)
      .values({ pageId: input.pageId, propertyId: input.propertyId, ...fields })
      .onConflictDoUpdate({
        target: [s.values.pageId, s.values.propertyId],
        set: fields,
      });
    return { revision, value };
  });
}
