import { useDraggable } from "@dnd-kit/react";
import type { PropertyValue } from "@digipm/contracts";
import type { Property, Row } from "./types";
export function BoardCard({
  row,
  editable,
  onNavigate,
  property,
  onChange,
}: {
  row: Row;
  property: Property;
  onChange: (value: PropertyValue) => void;
  editable: boolean;
  onNavigate: (id: string) => void;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: row.id,
    data: { row },
    disabled: !editable,
  });
  return (
    <div ref={ref} className={`board-card ${isDragging ? "dragging" : ""}`}>
      <button
        ref={handleRef}
        aria-label={`Déplacer ${row.title}`}
        className="board-grip"
        disabled={!editable}
      >
        ⠿
      </button>
      <button onClick={() => onNavigate(row.id)}>
        {row.icon}
        <strong>{row.title}</strong>
      </button>
      {editable && (
        <select
          aria-label={`Statut de ${row.title}`}
          value={String(row.values[property.id]?.value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">Sans statut</option>
          {property.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
