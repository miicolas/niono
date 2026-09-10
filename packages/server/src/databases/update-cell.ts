import type { Connection } from "../access";
import { db, schema as s } from "@digipm/db";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { validatePropertyValue, type PropertyValue } from "@digipm/contracts";
import { accessPage, withPage, missing } from "../access";

export async function updateCell(
  userId: string,
  input: {
    pageId: string;
    propertyId: string;
    value: PropertyValue;
    expectedRevision: number;
  },
  connection: Connection = db,
) {
  return withPage(
    userId,
    input.pageId,
    async (tx) => {
      const [entry] = await tx
        .select()
        .from(s.entries)
        .where(eq(s.entries.pageId, input.pageId));
      if (!entry) throw missing();
      const [property] = await tx
        .select()
        .from(s.properties)
        .where(
          and(
            eq(s.properties.id, input.propertyId),
            eq(s.properties.sourceId, entry.sourceId),
          ),
        )
        .for("update");
      if (!property) throw missing();
      if (!validatePropertyValue(property.type, input.value, property.options))
        throw new ORPCError("BAD_REQUEST", {
          message: "Valeur incompatible avec cette propriété.",
        });
      if (property.type === "person" && Array.isArray(input.value)) {
        const { page } = await accessPage(tx, userId, input.pageId);
        for (const id of input.value) {
          const [member] = await tx
            .select()
            .from(s.member)
            .where(
              and(
                eq(s.member.organizationId, page.workspaceId),
                eq(s.member.userId, id),
              ),
            );
          if (!member) throw missing();
        }
      }
      if (property.type === "files" && Array.isArray(input.value))
        for (const id of input.value) {
          const [asset] = await tx
            .select()
            .from(s.assets)
            .where(and(eq(s.assets.id, id), eq(s.assets.pageId, input.pageId)));
          if (!asset) throw missing();
        }
      const [old] = await tx
        .select()
        .from(s.values)
        .where(
          and(
            eq(s.values.pageId, input.pageId),
            eq(s.values.propertyId, input.propertyId),
          ),
        );
      if ((old?.revision ?? 0) !== input.expectedRevision)
        throw new ORPCError("CONFLICT", {
          message: "Cette cellule a été modifiée ailleurs.",
        });
      const value = input.value;
      const revision = (old?.revision ?? 0) + 1;
      const fields = {
        textValue: typeof value === "string" ? value : null,
        numberValue: typeof value === "number" ? value : null,
        boolValue: typeof value === "boolean" ? value : null,
        arrayValue: Array.isArray(value) ? value : null,
        revision,
      };
      await tx
        .insert(s.values)
        .values({
          pageId: input.pageId,
          propertyId: input.propertyId,
          ...fields,
        })
        .onConflictDoUpdate({
          target: [s.values.pageId, s.values.propertyId],
          set: fields,
        });
      return { revision, value };
    },
    false,
    connection,
  );
}
