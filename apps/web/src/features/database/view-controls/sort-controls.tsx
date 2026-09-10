import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { ArrowUp, ArrowUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type ViewControlsState } from "./view-controls-state";

export function SortControls({
  sorts,
  setSorts,
  fields,
}: Pick<ViewControlsState, "sorts" | "setSorts" | "fields">) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={sorts.length ? "view-control-active" : ""}
        >
          <ArrowUpDown size={14} />
          Trier
          {!!sorts.length && (
            <Badge variant="secondary" className="control-count">
              {sorts.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="database-sort-popover"
        aria-label="Tris de la vue"
      >
        <div className="view-control-heading">
          <strong>Tris</strong>
          <Button
            size="sm"
            variant="ghost"
            disabled={!sorts.length}
            onClick={() => setSorts([])}
          >
            Tout effacer
          </Button>
        </div>
        <p className="muted text-xs mb-3">
          Le premier tri est prioritaire, les suivants départagent les égalités.
        </p>
        {sorts.map((sort, index) => (
          <div className="view-sort-row" key={index}>
            <SelectField
              aria-label={`Propriété du tri ${index + 1}`}
              value={sort.propertyId}
              onValueChange={(value) =>
                setSorts(
                  sorts.map((s, i) =>
                    i === index ? { ...s, propertyId: value } : s,
                  ),
                )
              }
            >
              {fields
                .filter(
                  (p) =>
                    p.id === sort.propertyId ||
                    !sorts.some((s) => s.propertyId === p.id),
                )
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectField>
            <SelectField
              aria-label={`Sens du tri ${index + 1}`}
              value={sort.direction}
              onValueChange={(value) =>
                setSorts(
                  sorts.map((s, i) =>
                    i === index
                      ? {
                          ...s,
                          direction: value === "desc" ? "desc" : "asc",
                        }
                      : s,
                  ),
                )
              }
            >
              <SelectItem value="asc">Croissant ↑</SelectItem>
              <SelectItem value="desc">Décroissant ↓</SelectItem>
            </SelectField>
            <Button
              size="icon"
              variant="ghost"
              disabled={index === 0}
              aria-label={`Monter le tri ${index + 1}`}
              onClick={() => {
                const next = [...sorts];
                [next[index - 1], next[index]] = [
                  next[index]!,
                  next[index - 1]!,
                ];
                setSorts(next);
              }}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Supprimer le tri ${index + 1}`}
              onClick={() => setSorts(sorts.filter((_, i) => i !== index))}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          disabled={sorts.length >= Math.min(20, fields.length)}
          onClick={() => {
            const field = fields.find(
              (p) => !sorts.some((s) => s.propertyId === p.id),
            );
            if (field)
              setSorts([...sorts, { propertyId: field.id, direction: "asc" }]);
          }}
        >
          <Plus size={14} />
          Ajouter un tri
        </Button>
      </PopoverContent>
    </Popover>
  );
}
