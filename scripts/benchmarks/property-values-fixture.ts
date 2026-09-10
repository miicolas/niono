import type { schema } from "../../packages/db/src";

export const rows = Array.from({ length: 100 }, (_, index) => ({
  id: `page-${index}`,
}));

export const values: (typeof schema.values.$inferSelect)[] = rows.flatMap(
  (row) =>
    Array.from({ length: 100 }, (_, index) => ({
      pageId: row.id,
      propertyId: `property-${index}`,
      revision: index,
      textValue: null,
      numberValue: index,
      boolValue: null,
      arrayValue: null,
    })),
);
