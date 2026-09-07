import { ChevronRight } from "lucide-react";
import { displayValue } from "./display-value";
import type { Members, Property, Row } from "./types";
export function ListLayout({
  rows,
  visible,
  members,
  onNavigate,
}: {
  rows: Row[];
  visible: Property[];
  members: Members;
  onNavigate: (id: string) => void;
}) {
  return (
    <div>
      {rows.map((row) => (
        <button
          className="database-list-row"
          key={row.id}
          onClick={() => onNavigate(row.id)}
          type="button"
        >
          <span>{row.icon}</span>
          <strong>{row.title}</strong>
          {visible.slice(0, 3).map((p) => (
            <span className="property-preview" key={p.id}>
              {displayValue(p, row.values[p.id]?.value ?? null, members)}
            </span>
          ))}
          <ChevronRight size={14} />
        </button>
      ))}
    </div>
  );
}
