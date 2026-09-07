import { displayValue } from "./display-value";
import type { Members, Property, Row } from "./types";
export function GalleryLayout({
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
    <div className="gallery-grid">
      {rows.map((row) => (
        <button
          className="gallery-card"
          key={row.id}
          onClick={() => onNavigate(row.id)}
          type="button"
        >
          <div className="gallery-cover">
            {row.cover ? (
              <img alt="" src={row.cover} />
            ) : (
              <span>{row.icon}</span>
            )}
          </div>
          <strong>{row.title}</strong>
          {visible.slice(0, 3).map((p) => (
            <span className="property-preview" key={p.id}>
              {displayValue(p, row.values[p.id]?.value ?? null, members)}
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}
