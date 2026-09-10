import { z } from "zod";

export const propertyOptionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  color: z.string().max(30),
});
