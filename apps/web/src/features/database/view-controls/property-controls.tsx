import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, Columns3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { moveColumn } from "./move-column";
import { type ViewControlsState } from "./view-controls-state";

export function PropertyControls({
  order,
  config,
  onChange,
  fields,
  onAddProperty,
}: Pick<
  ViewControlsState,
  "order" | "config" | "onChange" | "fields" | "onAddProperty"
>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <Columns3 size={14} />
          Propriétés
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="database-properties-popover"
        aria-label="Propriétés de la vue"
      >
        <strong>Propriétés de la vue</strong>
        <p className="muted text-xs my-2">
          Choisissez leur visibilité et leur ordre.
        </p>
        {order.map((id, index) => (
          <div className="view-property-row" key={id}>
            <Label className="flex items-center gap-2">
              <Checkbox
                disabled={id === "title"}
                checked={!config.hidden.includes(id)}
                onCheckedChange={(checked) =>
                  onChange({
                    ...config,
                    hidden:
                      checked === true
                        ? config.hidden.filter((p) => p !== id)
                        : [...config.hidden, id],
                  })
                }
              />
              <span>{fields.find((p) => p.id === id)?.name}</span>
            </Label>
            <Button
              size="icon"
              variant="ghost"
              disabled={index === 0}
              aria-label={`Monter ${fields.find((p) => p.id === id)?.name}`}
              onClick={() =>
                onChange({
                  ...config,
                  columnOrder: moveColumn(order, id, order[index - 1]!),
                })
              }
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={index === order.length - 1}
              aria-label={`Descendre ${fields.find((p) => p.id === id)?.name}`}
              onClick={() =>
                onChange({
                  ...config,
                  columnOrder: moveColumn(order, id, order[index + 1]!),
                })
              }
            >
              <ArrowDown size={14} />
            </Button>
          </div>
        ))}
        {onAddProperty && (
          <Button size="sm" variant="ghost" onClick={onAddProperty}>
            <Plus size={14} />
            Ajouter une propriété
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
