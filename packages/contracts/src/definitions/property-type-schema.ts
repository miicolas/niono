import { z } from "zod";

export const propertyTypeSchema = z.enum([
  "text",
  "number",
  "checkbox",
  "select",
  "multiSelect",
  "status",
  "date",
  "person",
  "url",
  "email",
  "files",
]);
