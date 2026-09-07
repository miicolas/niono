import { z } from "zod";
import { safeUrl } from "@/lib/editor/safe-url";
import { idSchema } from "./common";
import {
  propertyOptionSchema,
  propertyTypeSchema,
  propertyValueSchema,
  viewSchema,
} from "./databases";
import { documentSchema } from "./documents";

export const archiveSchema = z.object({
  format: z.literal("digipm-archive"),
  version: z.literal(1),
  pages: z
    .array(
      z.object({
        id: idSchema,
        parentId: idSchema.nullable(),
        title: z.string().max(300),
        icon: z.string().max(50),
        cover: z.string().refine(safeUrl).nullable(),
        kind: z.enum(["page", "database"]),
        privateRoot: z.boolean(),
        content: documentSchema,
      })
    )
    .min(1)
    .max(200),
  sources: z.array(z.object({ id: idSchema, pageId: idSchema })).max(200),
  properties: z
    .array(
      z.object({
        id: idSchema,
        sourceId: idSchema,
        name: z.string().min(1).max(100),
        type: propertyTypeSchema,
        options: z.array(propertyOptionSchema).max(100),
      })
    )
    .max(4000),
  entries: z.array(z.object({ pageId: idSchema, sourceId: idSchema })).max(200),
  values: z
    .array(
      z.object({
        pageId: idSchema,
        propertyId: idSchema,
        value: propertyValueSchema,
      })
    )
    .max(10_000),
  views: z
    .array(
      z.object({
        sourceId: idSchema,
        name: z.string().min(1).max(100),
        config: viewSchema,
      })
    )
    .max(1000),
  assets: z
    .array(
      z.object({
        id: idSchema,
        pageId: idSchema,
        name: z.string().max(200),
        data: z.string().max(12_000_000),
      })
    )
    .max(200),
  warnings: z.array(z.string().max(300)).max(500).default([]),
});
export type Archive = z.infer<typeof archiveSchema>;

export const emptyArchive = (): Archive => ({
  format: "digipm-archive",
  version: 1,
  pages: [],
  sources: [],
  properties: [],
  entries: [],
  values: [],
  views: [],
  assets: [],
  warnings: [],
});

export const exportArchiveInput = z.object({
  pageId: idSchema,
  includeAssets: z.boolean().default(true),
});

export const importArchiveInput = z.object({
  workspaceId: idSchema,
  importId: idSchema,
  archive: archiveSchema,
});
