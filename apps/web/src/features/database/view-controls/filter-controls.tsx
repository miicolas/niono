import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { Filter, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type FilterRule } from "./shared";
import { newFilter } from "./new-filter";
import { filterOperators } from "./filter-operators";
import { type ViewControlsState } from "./view-controls-state";

export function FilterControls({
  filterOpen,
  setFilters,
  config,
  setMode,
  setFilterOpen,
  submitFilterform,
  filters,
  mode,
  properties,
  members,
  patchFilter,
  fields,
  filterForm,
}: Pick<
  ViewControlsState,
  | "filterOpen"
  | "setFilters"
  | "config"
  | "setMode"
  | "setFilterOpen"
  | "submitFilterform"
  | "filters"
  | "mode"
  | "properties"
  | "members"
  | "patchFilter"
  | "fields"
  | "filterForm"
>) {
  return (
    <Popover
      open={filterOpen}
      onOpenChange={(open) => {
        if (open) {
          setFilters(config.filters);
          setMode(config.filterMode);
        }
        setFilterOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={config.filters.length ? "view-control-active" : ""}
        >
          <Filter size={14} />
          Filtrer
          {config.filters.length > 0 && (
            <Badge variant="secondary" className="control-count">
              {config.filters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="database-filter-popover"
        aria-label="Filtres de la vue"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitFilterform();
          }}
        >
          <div className="view-control-heading">
            <strong>Filtres</strong>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!filters.length}
              onClick={() => setFilters([])}
            >
              Tout effacer
            </Button>
          </div>
          <p className="muted text-xs mb-3">
            Affichez les pages qui correspondent à vos conditions.
          </p>
          {!!filters.length && (
            <Label className="filter-mode">
              Satisfaire
              <SelectField
                aria-label="Combinaison des filtres"
                value={mode}
                onValueChange={(value) =>
                  setMode(value === "or" ? "or" : "and")
                }
              >
                <SelectItem value="and">Toutes les conditions (ET)</SelectItem>
                <SelectItem value="or">Au moins une condition (OU)</SelectItem>
              </SelectField>
            </Label>
          )}
          {filters.map((f, index) => {
            const property = properties.find((p) => p.id === f.propertyId);
            const type = property?.type ?? "text";
            const options =
              type === "person" ? members : (property?.options ?? []);
            const noValue = ["empty", "notEmpty"].includes(f.operator);
            return (
              <div className="view-filter-row" key={index}>
                <SelectField
                  aria-label={`Propriété du filtre ${index + 1}`}
                  value={f.propertyId}
                  onValueChange={(value) =>
                    patchFilter(index, newFilter(value, properties))
                  }
                >
                  {fields.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectField>
                <SelectField
                  aria-label={`Condition du filtre ${index + 1}`}
                  value={f.operator}
                  onValueChange={(value) =>
                    patchFilter(index, {
                      operator: value as FilterRule["operator"],
                    })
                  }
                >
                  {filterOperators(type).map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectField>
                {!noValue &&
                  (type === "checkbox" ? (
                    <SelectField
                      aria-label={`Valeur du filtre ${index + 1}`}
                      value={f.value}
                      onValueChange={(value) =>
                        patchFilter(index, { value: value })
                      }
                    >
                      <SelectItem value="true">Cochée</SelectItem>
                      <SelectItem value="false">Non cochée</SelectItem>
                    </SelectField>
                  ) : ["select", "multiSelect", "status", "person"].includes(
                      type,
                    ) ? (
                    <SelectField
                      required
                      aria-label={`Valeur du filtre ${index + 1}`}
                      value={f.value}
                      onValueChange={(value) =>
                        patchFilter(index, { value: value })
                      }
                      emptyLabel="Choisir…"
                    >
                      {options.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectField>
                  ) : type === "date" ? (
                    <DatePicker
                      required
                      aria-label={`Valeur du filtre ${index + 1}`}
                      value={f.value}
                      onValueChange={(value) => patchFilter(index, { value })}
                    />
                  ) : (
                    <Input
                      aria-label={`Valeur du filtre ${index + 1}`}
                      type={type === "number" ? "number" : "text"}
                      step={type === "number" ? "any" : undefined}
                      required
                      maxLength={300}
                      value={f.value}
                      onChange={(e) =>
                        patchFilter(index, { value: e.target.value })
                      }
                      placeholder="Valeur…"
                    />
                  ))}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Supprimer le filtre ${index + 1}`}
                  onClick={() =>
                    setFilters((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <X size={14} />
                </Button>
              </div>
            );
          })}
          <div className="view-control-footer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={filters.length >= 20}
              onClick={() =>
                setFilters((current) => [
                  ...current,
                  newFilter("title", properties),
                ])
              }
            >
              <Plus size={14} />
              Ajouter un filtre
            </Button>
            <Button
              size="sm"
              disabled={filters.some(
                (f) => !["empty", "notEmpty"].includes(f.operator) && !f.value,
              )}
            >
              Appliquer
            </Button>
          </div>
          <filterForm.Subscribe selector={(state) => state.errors}>
            {(errors) => (
              <FieldError
                errors={errors.flatMap((error) =>
                  error ? Object.values(error).flat() : [],
                )}
              />
            )}
          </filterForm.Subscribe>
        </form>
      </PopoverContent>
    </Popover>
  );
}
