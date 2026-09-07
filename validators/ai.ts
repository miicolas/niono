import { z } from "zod";
import { idSchema } from "./common";

export const rewriteTextInput = z.object({
  pageId: idSchema,
  text: z.string().min(1).max(12_000),
  instruction: z.string().min(1).max(1000),
});
