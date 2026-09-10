import { z } from "zod";
import { propertyValueSchema } from "./property-value-schema";

export type PropertyValue = z.infer<typeof propertyValueSchema>;
