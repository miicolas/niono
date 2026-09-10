import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DatabaseState } from "./shared";
import { displayValue } from "./display-value";

export function DatabaseGallery({
  config,
  rows,
  onNavigate,
  visible,
  members,
}: Pick<
  DatabaseState,
  "config" | "rows" | "onNavigate" | "visible" | "members"
>) {
  return (
    config.layout === "gallery" && (
      <div className="gallery-grid">
        {rows.map((row) => (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="gallery-card"
            key={row.id}
            onClick={() => onNavigate(row.id)}
          >
            <div className="gallery-cover">
              {row.cover ? (
                <img src={row.cover} alt="" />
              ) : (
                <span>{row.icon}</span>
              )}
            </div>
            <strong>{row.title}</strong>
            {visible.slice(0, 3).map((p) => (
              <Badge
                variant="secondary"
                className="property-preview"
                key={p.id}
              >
                {displayValue(
                  p,
                  row.values[p.id]?.value ?? null,
                  members.data ?? [],
                )}
              </Badge>
            ))}
          </Button>
        ))}
      </div>
    )
  );
}
