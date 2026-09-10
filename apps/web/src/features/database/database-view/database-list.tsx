import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type DatabaseState } from "./shared";
import { displayValue } from "./display-value";

export function DatabaseList({
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
    config.layout === "list" && (
      <div>
        {rows.map((row) => (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            key={row.id}
            className="database-list-row"
            onClick={() => onNavigate(row.id)}
          >
            <span>{row.icon}</span>
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
            <ChevronRight size={14} />
          </Button>
        ))}
      </div>
    )
  );
}
