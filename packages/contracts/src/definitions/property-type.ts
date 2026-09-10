import { z } from "zod";
import { propertyTypeSchema } from "./property-type-schema";

export type PropertyType = z.infer<typeof propertyTypeSchema>;
