import { useId } from "react";
import { Check } from "lucide-react";
import {
  chartConfigSchema,
  chartPropertyTypes,
  type ChartConfig,
  type PropertyType,
  type ViewConfig,
} from "@digipm/contracts";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartTypeControl } from "./chart-type-control";
import { chartColors } from "./chart-data";

export const chartAggregations = [
  { id: "count", name: "Nombre de pages" },
  { id: "sum", name: "Somme" },
  { id: "average", name: "Moyenne" },
  { id: "min", name: "Minimum" },
  { id: "max", name: "Maximum" },
] as const;
export type ChartProperty = { id: string; name: string; type: PropertyType };
const colors = [
  { id: "blue", name: "Bleu" },
  { id: "green", name: "Vert" },
  { id: "orange", name: "Orange" },
  { id: "purple", name: "Violet" },
  { id: "pink", name: "Rose" },
] as const;

export function ChartSettings({
  config,
  properties,
  onChange,
}: {
  config: ViewConfig;
  properties: ChartProperty[];
  onChange: (value: ViewConfig) => void;
}) {
  const id = useId();
  const chart = chartConfigSchema.parse(config.chart ?? {});
  const numeric = properties.filter((p) => p.type === "number");
  const change = (patch: Partial<ChartConfig>) =>
    onChange({ ...config, chart: { ...chart, ...patch } });
  return (
    <div className="chart-settings">
      <ChartTypeControl
        value={chart.type}
        presentation="previews"
        onChange={(type) => change({ type })}
      />
      <div className="chart-settings-section">
        <div className="chart-setting-row">
          <Label htmlFor={`${id}-category`}>Grouper par</Label>
          <SelectField
            id={`${id}-category`}
            size="sm"
            aria-label="Catégories du graphique"
            value={chart.xProperty}
            onValueChange={(xProperty) => change({ xProperty })}
          >
            <SelectItem value="title">Nom</SelectItem>
            {properties
              .filter((p) => chartPropertyTypes.includes(p.type))
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectField>
        </div>
        {properties.find((p) => p.id === chart.xProperty)?.type === "date" && (
          <div className="chart-setting-row">
            <Label htmlFor={`${id}-date`}>Intervalle</Label>
            <SelectField
              id={`${id}-date`}
              size="sm"
              aria-label="Regrouper les dates"
              value={chart.dateBucket}
              onValueChange={(dateBucket) =>
                change({
                  dateBucket: chartConfigSchema.parse({ ...chart, dateBucket })
                    .dateBucket,
                })
              }
            >
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectField>
          </div>
        )}
        <div className="chart-setting-row">
          <Label htmlFor={`${id}-calculation`}>Calcul</Label>
          <SelectField
            id={`${id}-calculation`}
            size="sm"
            aria-label="Calcul du graphique"
            value={chart.aggregation}
            onValueChange={(next) => {
              const aggregation = chartAggregations.find(
                (a) => a.id === next,
              )?.id;
              if (aggregation)
                change({
                  aggregation,
                  metricProperty:
                    aggregation === "count"
                      ? undefined
                      : (chart.metricProperty ?? numeric[0]?.id),
                });
            }}
          >
            {chartAggregations.map((a) => (
              <SelectItem
                key={a.id}
                value={a.id}
                disabled={a.id !== "count" && !numeric.length}
              >
                {a.name}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        {chart.aggregation !== "count" && (
          <div className="chart-setting-row">
            <Label htmlFor={`${id}-metric`}>Propriété</Label>
            <SelectField
              id={`${id}-metric`}
              size="sm"
              aria-label="Propriété à calculer"
              value={chart.metricProperty}
              onValueChange={(metricProperty) => change({ metricProperty })}
            >
              {numeric.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectField>
          </div>
        )}
        {!numeric.length && (
          <p className="chart-settings-hint">
            Une propriété Nombre permet de calculer une somme ou une moyenne.
          </p>
        )}
        <div className="chart-setting-row">
          <Label htmlFor={`${id}-sort`}>Trier</Label>
          <SelectField
            id={`${id}-sort`}
            size="sm"
            aria-label="Ordre des catégories"
            value={chart.sort}
            onValueChange={(sort) =>
              change({ sort: chartConfigSchema.parse({ ...chart, sort }).sort })
            }
          >
            <SelectItem value="categoryAsc">Catégorie · A → Z</SelectItem>
            <SelectItem value="categoryDesc">Catégorie · Z → A</SelectItem>
            <SelectItem value="valueDesc">Valeur · décroissante</SelectItem>
            <SelectItem value="valueAsc">Valeur · croissante</SelectItem>
          </SelectField>
        </div>
      </div>
      <div className="chart-settings-section">
        <div className="chart-setting-row">
          <span className="chart-setting-label">Couleur</span>
          <ToggleGroup
            type="single"
            value={chart.color}
            className="chart-color-picker"
            aria-label="Couleur du graphique"
            onValueChange={(value) => {
              const color = colors.find((c) => c.id === value);
              if (color) change({ color: color.id });
            }}
          >
            {colors.map((color) => (
              <ToggleGroupItem
                key={color.id}
                value={color.id}
                aria-label={color.name}
                title={color.name}
                className="chart-color-option"
              >
                <span style={{ background: chartColors[color.id] }}>
                  {chart.color === color.id && <Check size={12} />}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="chart-setting-row">
          <Label htmlFor={`${id}-legend`}>Légende</Label>
          <Checkbox
            id={`${id}-legend`}
            aria-label="Afficher la légende"
            checked={chart.showLegend}
            onCheckedChange={(checked) =>
              change({ showLegend: checked === true })
            }
          />
        </div>
      </div>
    </div>
  );
}
