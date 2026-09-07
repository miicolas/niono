import { useState } from "react";
import { isChoiceType } from "@/lib/databases/property-kinds";
import type { PropertyValue } from "@/validators/databases";
import { displayValue } from "./display-value";
import { FilesCell } from "./files-cell";
import type { Members, Property } from "./types";
export function PropertyCell({
  pageId,
  property,
  value,
  editable,
  members,
  onChange,
}: {
  pageId: string;
  property: Property;
  value: PropertyValue;
  editable: boolean;
  members: Members;
  onChange: (value: PropertyValue) => void;
}) {
  const [draft, setDraft] = useState(
    typeof value === "string" || typeof value === "number" ? String(value) : ""
  );
  if (property.type === "files") {
    return (
      <FilesCell
        editable={editable}
        onChange={onChange}
        pageId={pageId}
        property={property}
        value={value}
      />
    );
  }
  if (!editable) {
    return (
      <span className="cell-value">
        {displayValue(property, value, members)}
      </span>
    );
  }
  if (property.type === "checkbox") {
    return (
      <input
        aria-label={property.name}
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        type="checkbox"
      />
    );
  }
  if (isChoiceType(property.type)) {
    return (
      <select
        aria-label={property.name}
        onChange={(e) => onChange(e.target.value || null)}
        value={typeof value === "string" ? value : ""}
      >
        <option value="">—</option>
        {property.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
  }
  if (property.type === "multiSelect" || property.type === "person") {
    const options =
      property.type === "person"
        ? members.map((m) => ({ id: m.id, name: m.name }))
        : property.options;
    const selected = Array.isArray(value) ? value : [];
    return (
      <details className="cell-multi">
        <summary>{displayValue(property, value, members) || "—"}</summary>
        <div>
          {options.map((o) => (
            <label key={o.id}>
              <input
                checked={selected.includes(o.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((id) => id !== o.id)
                  )
                }
                type="checkbox"
              />
              {o.name}
            </label>
          ))}
        </div>
      </details>
    );
  }
  return (
    <input
      aria-label={property.name}
      onBlur={() => {
        const next =
          draft === ""
            ? null
            : property.type === "number"
              ? Number(draft)
              : draft;
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
      type={
        ["number", "date", "email", "url"].includes(property.type)
          ? property.type
          : "text"
      }
      value={draft}
    />
  );
}
