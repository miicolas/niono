import { useState } from "react";
import { isChoiceType, type PropertyValue } from "@digipm/contracts";
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
    typeof value === "string" || typeof value === "number" ? String(value) : "",
  );
  if (property.type === "files")
    return (
      <FilesCell
        pageId={pageId}
        property={property}
        value={value}
        editable={editable}
        onChange={onChange}
      />
    );
  if (!editable)
    return (
      <span className="cell-value">
        {displayValue(property, value, members)}
      </span>
    );
  if (property.type === "checkbox")
    return (
      <input
        type="checkbox"
        aria-label={property.name}
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  if (isChoiceType(property.type))
    return (
      <select
        aria-label={property.name}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">—</option>
        {property.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
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
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((id) => id !== o.id),
                  )
                }
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
      type={
        ["number", "date", "email", "url"].includes(property.type)
          ? property.type
          : "text"
      }
      step={property.type === "number" ? "any" : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next =
          draft === ""
            ? null
            : property.type === "number"
              ? Number(draft)
              : draft;
        if (next !== value) onChange(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
