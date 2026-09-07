import { z } from "zod";
import { idSchema } from "./common";

export const propertyTypeSchema = z.enum([
  "text",
  "number",
  "checkbox",
  "select",
  "multiSelect",
  "status",
  "date",
  "person",
  "url",
  "email",
  "files",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const propertyOptionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  color: z.string().max(30),
});
export type PropertyOption = z.infer<typeof propertyOptionSchema>;

export const propertyValueSchema = z.union([
  z.string().max(10_000),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(300)).max(100),
  z.null(),
]);
export type PropertyValue = z.infer<typeof propertyValueSchema>;

export const viewSchema = z.object({
  layout: z
    .enum(["table", "board", "list", "gallery", "calendar"])
    .default("table"),
  sortBy: z.string().max(100).default("position"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  groupBy: z.string().max(100).optional(),
  hidden: z.array(z.string().max(100)).max(100).default([]),
  filters: z
    .array(
      z.object({
        propertyId: z.string(),
        operator: z.enum(["contains", "eq", "neq", "gt", "lt", "empty"]),
        value: z.string().max(300),
      })
    )
    .max(20)
    .default([]),
  filterMode: z.enum(["and", "or"]).default("and"),
});
export type ViewConfig = z.infer<typeof viewSchema>;
export type FilterOperator = ViewConfig["filters"][number]["operator"];
export const defaultViewConfig: ViewConfig = viewSchema.parse({});

const revisionSchema = z.number().int().nonnegative();

export const getDatabaseInput = z.object({ id: idSchema });

export const addEntryInput = z.object({
  pageId: idSchema,
  title: z.string().max(300),
});

export const addPropertyInput = z.object({
  pageId: idSchema,
  name: z.string().min(1).max(100),
  type: propertyTypeSchema,
  options: z.array(propertyOptionSchema).max(100),
});

export const saveViewInput = z.object({
  pageId: idSchema,
  id: idSchema.optional(),
  name: z.string().min(1).max(100),
  config: viewSchema,
  expectedRevision: revisionSchema.optional(),
});

export const queryEntriesInput = z.object({
  pageId: idSchema,
  config: viewSchema,
  offset: z.number().int().min(0).max(1_000_000).default(0),
  limit: z.number().int().min(1).max(100).default(50),
  query: z.string().max(200).optional(),
  scope: z
    .union([
      z.object({
        propertyId: idSchema,
        value: z.string().max(100).nullable(),
      }),
      z.object({
        propertyId: idSchema,
        from: z.iso.date(),
        to: z.iso.date(),
      }),
    ])
    .optional(),
});

export const updateCellInput = z.object({
  pageId: idSchema,
  propertyId: idSchema,
  value: propertyValueSchema,
  expectedRevision: revisionSchema,
});
