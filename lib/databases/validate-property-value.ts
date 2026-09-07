import { z } from "zod";
import { safeUrl } from "@/lib/editor/safe-url";
import type {
  PropertyOption,
  PropertyType,
  PropertyValue,
} from "@/validators/databases";
import { isChoiceType, isMultiValued } from "./property-kinds";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string): boolean {
  return (
    ISO_DATE.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

/** Vérifie qu'une valeur correspond au type de sa propriété et à ses options. */
export function validatePropertyValue(
  type: PropertyType,
  value: PropertyValue,
  options: PropertyOption[] = []
): boolean {
  if (value === null) {
    return true;
  }
  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }
  if (type === "checkbox") {
    return typeof value === "boolean";
  }
  if (type === "multiSelect") {
    return (
      Array.isArray(value) &&
      value.every((v) => options.some((o) => o.id === v))
    );
  }
  if (isMultiValued(type)) {
    return Array.isArray(value);
  }
  if (isChoiceType(type)) {
    return typeof value === "string" && options.some((o) => o.id === value);
  }
  if (type === "date") {
    return typeof value === "string" && isCalendarDate(value);
  }
  if (type === "url") {
    return safeUrl(value);
  }
  if (type === "email") {
    return z.email().safeParse(value).success;
  }
  return typeof value === "string";
}
