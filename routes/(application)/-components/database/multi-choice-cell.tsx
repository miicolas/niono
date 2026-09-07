import type { PropertyValue } from "@/validators/databases";
import { displayValue } from "./display-value";
import type { Members, Property } from "./types";
export function MultiChoiceCell({
  property,
  value,
  members,
  onChange,
}: {
  property: Property;
  value: PropertyValue;
  members: Members;
  onChange: (value: PropertyValue) => void;
}) {
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
