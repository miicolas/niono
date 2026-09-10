import { z } from "zod";
import { propertyOptionSchema } from "./property-option-schema";

export type PropertyOption = z.infer<typeof propertyOptionSchema>;
