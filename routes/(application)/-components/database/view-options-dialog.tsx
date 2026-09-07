import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isChoiceType } from "@/lib/databases/property-kinds";
import type { ViewConfig } from "@/validators/databases";
import { FilterRow } from "./filter-row";
import type { Property } from "./types";
export function ViewOptionsDialog({
  open,
  config,
  properties,
  onClose,
  setConfig,
}: {
  open: boolean;
  config: ViewConfig;
  properties: Property[];
  onClose: () => void;
  setConfig: (config: ViewConfig) => void;
}) {
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Options de la vue</DialogTitle>
          <DialogDescription>
            Filtrez, triez et choisissez les propriétés visibles.
          </DialogDescription>
        </DialogHeader>
        <div className="panel-form">
          <label>
            Trier par
            <select
              onChange={(e) => setConfig({ ...config, sortBy: e.target.value })}
              value={config.sortBy}
            >
              <option value="position">Ordre de création</option>
              <option value="title">Nom</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <select
            aria-label="Sens du tri"
            onChange={(e) =>
              setConfig({
                ...config,
                sortDirection: e.target.value === "desc" ? "desc" : "asc",
              })
            }
            value={config.sortDirection}
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
          <label>
            Grouper / propriété du calendrier
            <select
              onChange={(e) =>
                setConfig({ ...config, groupBy: e.target.value || undefined })
              }
              value={config.groupBy ?? ""}
            >
              <option value="">Automatique</option>
              {properties
                .filter((p) => isChoiceType(p.type) || p.type === "date")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <div>
            <span className="muted text-xs">Propriétés visibles</span>
            {properties.map((p) => (
              <label className="mt-2 flex flex-row! gap-2!" key={p.id}>
                <input
                  checked={!config.hidden.includes(p.id)}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      hidden: e.target.checked
                        ? config.hidden.filter((id) => id !== p.id)
                        : [...config.hidden, p.id],
                    })
                  }
                  type="checkbox"
                />
                {p.name}
              </label>
            ))}
          </div>
          <label>
            Filtres
            <select
              onChange={(e) =>
                setConfig({
                  ...config,
                  filterMode: e.target.value === "or" ? "or" : "and",
                })
              }
              value={config.filterMode}
            >
              <option value="and">Toutes les conditions</option>
              <option value="or">Au moins une condition</option>
            </select>
          </label>
          {config.filters.map((f, index) => (
            <FilterRow
              filter={f}
              key={index}
              onChange={(next) =>
                setConfig({
                  ...config,
                  filters: config.filters.map((v, i) =>
                    i === index ? next : v
                  ),
                })
              }
              onRemove={() =>
                setConfig({
                  ...config,
                  filters: config.filters.filter((_, i) => i !== index),
                })
              }
              properties={properties}
            />
          ))}
          <Button
            disabled={config.filters.length >= 20}
            onClick={() =>
              setConfig({
                ...config,
                filters: [
                  ...config.filters,
                  { propertyId: "title", operator: "contains", value: "" },
                ],
              })
            }
            variant="outline"
          >
            <Plus size={13} />
            Ajouter un filtre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
