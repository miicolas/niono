import { z } from "zod";
import { viewSchema } from "./view-schema";

export type ViewConfig = z.infer<typeof viewSchema>;
