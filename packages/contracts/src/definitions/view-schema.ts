import { z } from "zod";
import { chartConfigSchema } from "./chart-config-schema";

export const viewSchema = z.object({
  layout: z
    .enum(["table", "board", "list", "gallery", "calendar", "chart"])
    .default("table"),
  chart: chartConfigSchema.optional(),
  sortBy: z.string().max(100).default("position"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  sorts: z
    .array(
      z.object({
        propertyId: z.string().min(1).max(100),
        direction: z.enum(["asc", "desc"]),
      }),
    )
    .max(20)
    .default([]),
  columnOrder: z.array(z.string().min(1).max(100)).max(100).default([]),
  columnWidths: z
    .record(z.string().max(100), z.number().min(100).max(800))
    .default({}),
  groupBy: z.string().max(100).optional(),
  hidden: z.array(z.string().max(100)).max(100).default([]),
  filters: z
    .array(
      z.object({
        propertyId: z.string(),
        operator: z.enum([
          "contains",
          "notContains",
          "eq",
          "neq",
          "gt",
          "gte",
          "lt",
          "lte",
          "empty",
          "notEmpty",
          "startsWith",
          "endsWith",
        ]),
        value: z.string().max(300),
      }),
    )
    .max(20)
    .default([]),
  filterMode: z.enum(["and", "or"]).default("and"),
});
