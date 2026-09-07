import { useState } from "react";
import type { PropertyValue } from "@/validators/databases";
import type { Property } from "./types";

const inputTypes = ["number", "date", "email", "url"];
const parseDraft = (draft: string, property: Property): PropertyValue => {
  if (draft === "") {
    return null;
  }
  if (property.type === "number") {
    return Number(draft);
  }
  return draft;
};
export function TextCell({
  property,
  value,
  onChange,
}: {
  property: Property;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
}) {
  const [draft, setDraft] = useState(
    typeof value === "string" || typeof value === "number" ? String(value) : ""
  );
  return (
    <input
      aria-label={property.name}
      onBlur={() => {
        const next = parseDraft(draft, property);
        if (next !== value) {
          onChange(next);
        }
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      step={property.type === "number" ? "any" : undefined}
      type={inputTypes.includes(property.type) ? property.type : "text"}
      value={draft}
    />
  );
}
