import { z } from "zod";
import { archiveSchema } from "./archive-schema";

export type Archive = z.infer<typeof archiveSchema>;
