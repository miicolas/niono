import { isChoiceType } from "@/lib/databases/property-kinds";
import type { PropertyValue } from "@/validators/databases";
import { displayValue } from "./display-value";
import { FilesCell } from "./files-cell";
import { MultiChoiceCell } from "./multi-choice-cell";
import { TextCell } from "./text-cell";
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
    return (
      <MultiChoiceCell
        members={members}
        onChange={onChange}
        property={property}
        value={value}
      />
    );
  }
  return <TextCell onChange={onChange} property={property} value={value} />;
}
