import { filterOperatorsFor } from "@/lib/databases/property-kinds";
import type { ViewConfig } from "@/validators/databases";
import { operatorLabels } from "./operator-labels";
import type { Property } from "./types";

type Filter = ViewConfig["filters"][number];
export function FilterRow({
  filter,
  properties,
  onChange,
  onRemove,
}: {
  filter: Filter;
  properties: Property[];
  onChange: (filter: Filter) => void;
  onRemove: () => void;
}) {
  const type =
    properties.find((p) => p.id === filter.propertyId)?.type ?? "text";
  return (
    <div className="filter-row">
      <select
        aria-label="Propriété du filtre"
        onChange={(e) =>
          onChange({
            ...filter,
            propertyId: e.target.value,
            operator: "eq",
            value: "",
          })
        }
        value={filter.propertyId}
      >
        <option value="title">Nom</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Condition"
        onChange={(e) =>
          onChange({
            ...filter,
            operator: e.target.value as Filter["operator"],
          })
        }
        value={filter.operator}
      >
        {filterOperatorsFor(type).map((o) => (
          <option key={o} value={o}>
            {operatorLabels[o]}
          </option>
        ))}
      </select>
      <input
        aria-label="Valeur du filtre"
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        value={filter.value}
      />
      <button aria-label="Supprimer le filtre" onClick={onRemove} type="button">
        ×
      </button>
    </div>
  );
}
