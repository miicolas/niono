import { z } from "zod";

const relativeId = z
  .object({
    client: z.number().int().min(0).max(4294967295),
    clock: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
const relativePosition = z
  .object({
    type: relativeId.nullish(),
    tname: z.string().max(100).nullish(),
    item: relativeId.nullish(),
    assoc: z.number().int().min(-1).max(1).optional(),
  })
  .strict();
const cursorSchema = z
  .object({ anchor: relativePosition, head: relativePosition })
  .strict();

export const syncDocumentSchema = z.object({
  pageId: z.uuid(),
  vector: z
    .string()
    .max(200000)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/),
  update: z
    .string()
    .max(2800000)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/)
    .optional(),
});
export const presenceSchema = z.object({
  pageId: z.uuid(),
  clientId: z.number().int().min(0).max(4294967295),
  clock: z.number().int().nonnegative(),
  cursor: cursorSchema.nullable(),
  active: z.boolean(),
});
export type Presence = {
  clientId: number;
  clock: number;
  state: {
    user: { id: string; name: string; color: string };
    cursor: unknown;
  } | null;
};
