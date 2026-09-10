import { z } from "zod";
import { type PropertyType } from "./property-type";
import { type PropertyValue } from "./property-value";
import { type PropertyOption } from "./property-option";
import { safeUrl } from "./safe-url";

export function validatePropertyValue(
  type: PropertyType,
  value: PropertyValue,
  options: PropertyOption[] = [],
): boolean {
  if (value === null) return true;
  if (type === "number")
    return typeof value === "number" && Number.isFinite(value);
  if (type === "checkbox") return typeof value === "boolean";
  if (type === "multiSelect")
    return (
      Array.isArray(value) &&
      value.every((v) => options.some((o) => o.id === v))
    );
  if (type === "files" || type === "person") return Array.isArray(value);
  if (type === "select" || type === "status")
    return typeof value === "string" && options.some((o) => o.id === value);
  if (type === "date")
    return (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    );
  if (type === "url") return safeUrl(value);
  if (type === "email") return z.email().safeParse(value).success;
  return typeof value === "string";
}
