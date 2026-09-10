import { z } from "zod";
import * as databases from "../databases";
import {
  idSchema,
  propertyTypeSchema,
  propertyOptionSchema,
  propertyValueSchema,
  viewSchema,
} from "@digipm/contracts";
import { authenticated } from "./authenticated";
import { pageId } from "./page-id";

export const databasesRoutes = {
  get: authenticated
    .input(pageId)
    .handler(({ context, input }) =>
      databases.getDatabase(context.user.id, input.id),
    ),
  addEntry: authenticated
    .input(z.object({ pageId: idSchema, title: z.string().max(300) }))
    .handler(({ context, input }) =>
      databases.addEntry(context.user.id, input),
    ),
  addProperty: authenticated
    .input(
      z.object({
        pageId: idSchema,
        name: z.string().min(1).max(100),
        type: propertyTypeSchema,
        options: z.array(propertyOptionSchema).max(100),
      }),
    )
    .handler(({ context, input }) =>
      databases.addProperty(context.user.id, input),
    ),
  renameProperty: authenticated
    .input(
      z.object({
        pageId: idSchema,
        propertyId: idSchema,
        name: z.string().trim().min(1).max(100),
        expectedName: z.string().max(100),
      }),
    )
    .handler(({ context, input }) =>
      databases.renameProperty(context.user.id, input),
    ),
  deleteProperty: authenticated
    .input(
      z.object({
        pageId: idSchema,
        propertyId: idSchema,
        expectedName: z.string().max(100),
      }),
    )
    .handler(({ context, input }) =>
      databases.deleteProperty(context.user.id, input),
    ),
  saveView: authenticated
    .input(
      z.object({
        pageId: idSchema,
        id: idSchema.optional(),
        name: z.string().min(1).max(100),
        config: viewSchema,
        expectedRevision: z.number().int().nonnegative().optional(),
      }),
    )
    .handler(({ context, input }) =>
      databases.saveView(context.user.id, input),
    ),
  query: authenticated
    .input(
      z.object({
        pageId: idSchema,
        config: viewSchema,
        offset: z.number().int().min(0).max(1000000).default(0),
        limit: z.number().int().min(1).max(100).default(50),
        query: z.string().max(200).optional(),
        chartBucket: z.string().max(10000).nullable().optional(),
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
      }),
    )
    .handler(({ context, input }) =>
      databases.queryEntries(context.user.id, input),
    ),
  chart: authenticated
    .input(
      z.object({
        pageId: idSchema,
        config: viewSchema,
        query: z.string().max(200).optional(),
      }),
    )
    .handler(({ context, input }) =>
      databases.queryChart(context.user.id, input),
    ),
  updateCell: authenticated
    .input(
      z.object({
        pageId: idSchema,
        propertyId: idSchema,
        value: propertyValueSchema,
        expectedRevision: z.number().int().nonnegative(),
      }),
    )
    .handler(({ context, input }) =>
      databases.updateCell(context.user.id, input),
    ),
};
