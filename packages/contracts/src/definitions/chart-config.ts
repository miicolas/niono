import { z } from "zod";
import { chartConfigSchema } from "./chart-config-schema";

export type ChartConfig = z.infer<typeof chartConfigSchema>;
