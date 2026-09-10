import { z } from "zod";

export const propertyValueSchema = z.union([
  z.string().max(10000),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(300)).max(100),
  z.null(),
]);
