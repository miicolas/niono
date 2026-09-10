import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import { chartConfigSchema, type ViewConfig } from "@digipm/contracts";
import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { chartAggregations, type ChartProperty } from "./chart-settings";
import { ChartTypeControl } from "./chart-type-control";
import { ChartRenderer } from "./chart-renderer";
import { ChartSettingsPopover } from "./chart-settings-popover";
import {
  chartColors,
  categoryColor,
  numberFormat,
  type ChartDatum,
} from "./chart-data";
import { ChartDataTable } from "./chart-data-table";
import { ChartEntryDialog } from "./chart-entry-dialog";
import { exportChartSvg } from "./export-chart-svg";
import "./chart.css";

export function ChartView({
  pageId,
  config,
  properties,
  query,
  name,
  onChange,
  onNavigate,
}: {
  pageId: string;
  config: ViewConfig;
  properties: ChartProperty[];
  query: string;
  name: string;
  onChange: (value: ViewConfig) => void;
  onNavigate: (id: string) => void;
}) {
  const chart = chartConfigSchema.parse(config.chart ?? {});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const onSettings = () => setSettingsOpen(true);
  const plot = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<ChartDatum | null>(null);
  const category = properties.find((p) => p.id === chart.xProperty);
  const categoryName = category?.name ?? "Nom";
  const metric =
    chart.aggregation === "count"
      ? "Nombre de pages"
      : `${chartAggregations.find((a) => a.id === chart.aggregation)?.name} · ${properties.find((p) => p.id === chart.metricProperty)?.name ?? "Nombre"}`;
  const dataKey = {
    xProperty: chart.xProperty,
    aggregation: chart.aggregation,
    metricProperty: chart.metricProperty,
    dateBucket: chart.dateBucket,
    sort: chart.sort,
    filters: config.filters,
    filterMode: config.filterMode,
  };
  const result = useQuery({
    queryKey: ["entries", pageId, "chart", dataKey, query],
    queryFn: () => client.databases.chart({ pageId, config, query }),
  });
  const rows = useMemo(
    () =>
      (result.data?.groups ?? []).map((row) => {
        let label = row.label;
        if (category?.type === "date" && row.key) {
          const date = new Date(`${row.key}T00:00:00Z`);
          label = new Intl.DateTimeFormat("fr-FR", {
            timeZone: "UTC",
            year: "numeric",
            ...(chart.dateBucket !== "year" ? { month: "short" } : {}),
            ...(["day", "week"].includes(chart.dateBucket)
              ? { day: "numeric" }
              : {}),
          }).format(date);
          if (chart.dateBucket === "week") label = `Sem. du ${label}`;
        }
        return { ...row, label, id: JSON.stringify(row.key) };
      }),
    [result.data, category?.type, chart.dateBucket],
  );
  const total = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
  const tooMany = (result.data?.totalGroups ?? 0) > 200;
  const emptyMetric =
    rows.length > 0 && rows.every((row) => row.value === null);
  const invalidDonut =
    chart.type === "donut" &&
    (rows.some((row) => (row.value ?? 0) < 0) || total <= 0);
  const draw =
    !result.isPending &&
    !result.error &&
    rows.length > 0 &&
    !tooMany &&
    !emptyMetric &&
    !invalidDonut;
  const select = (row: ChartDatum) => {
    setSelection(row);
  };
  return (
    <div className="database-chart" aria-busy={result.isFetching}>
      <div className="chart-heading">
        <div>
          <h3>
            {metric} <span>par {categoryName}</span>
          </h3>
          <p>
            {result.data
              ? `${numberFormat.format(result.data.totalEntries)} pages${config.filters.length || query ? " après filtrage" : " dans la base"}`
              : "Chargement des données…"}
          </p>
        </div>
        <div className="chart-actions">
          <ChartTypeControl
            value={chart.type}
            onChange={(type) =>
              onChange({ ...config, chart: { ...chart, type } })
            }
          />
          <ChartSettingsPopover
            config={config}
            properties={properties}
            onChange={onChange}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Exporter le graphique en SVG"
            title="Exporter le graphique en SVG"
            disabled={!draw}
            onClick={() =>
              exportChartSvg(plot.current, name, rows, chart, metric)
            }
          >
            <Download size={16} />
          </Button>
        </div>
      </div>
      {result.isPending ? (
        <div className="chart-placeholder" role="status">
          Chargement du graphique…
        </div>
      ) : result.error ? (
        <Alert variant="destructive" className="chart-placeholder">
          <AlertDescription>{result.error.message}</AlertDescription>
          <Button variant="outline" onClick={() => void result.refetch()}>
            Réessayer
          </Button>
        </Alert>
      ) : !rows.length ? (
        <div className="chart-placeholder">
          <BarChart3 size={28} />
          <p>Aucune page à représenter</p>
          <span>Ajoutez des pages ou ajustez les filtres de cette vue.</span>
        </div>
      ) : tooMany ? (
        <div className="chart-placeholder">
          <p>
            {result.data?.totalGroups} catégories : le graphique est limité à
            200.
          </p>
          <span>
            Affinez les filtres ou choisissez une propriété avec moins de
            valeurs.
          </span>
          <Button variant="outline" onClick={onSettings}>
            Modifier les catégories
          </Button>
        </div>
      ) : emptyMetric ? (
        <div className="chart-placeholder">
          <p>Aucune valeur numérique à représenter.</p>
          <span>Renseignez la propriété choisie ou comptez les pages.</span>
          <Button variant="outline" onClick={onSettings}>
            Modifier le calcul
          </Button>
        </div>
      ) : invalidDonut ? (
        <div className="chart-placeholder">
          <p>
            Un anneau nécessite des valeurs positives et un total supérieur à
            zéro.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              onChange({ ...config, chart: { ...chart, type: "bar" } })
            }
          >
            Afficher en barres
          </Button>
        </div>
      ) : (
        <>
          <div className="chart-scroll">
            <div
              ref={plot}
              className="chart-plot"
              style={{
                minWidth: ["bar", "line"].includes(chart.type)
                  ? Math.max(0, rows.length * 48)
                  : undefined,
              }}
            >
              <ChartRenderer
                rows={rows}
                config={chart}
                metric={metric}
                category={categoryName}
                onSelect={select}
              />
              {chart.type === "donut" &&
                ["count", "sum"].includes(chart.aggregation) && (
                  <div className="chart-donut-total" aria-hidden="true">
                    <strong>{numberFormat.format(total)}</strong>
                    <span>
                      {chart.aggregation === "count" ? "pages" : "total"}
                    </span>
                  </div>
                )}
            </div>
          </div>
          {chart.showLegend && (
            <div className="chart-legend" aria-label="Légende du graphique">
              {chart.type === "donut" ? (
                rows.map((row, index) => (
                  <Button
                    key={row.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => select(row)}
                    title={row.label}
                  >
                    <span
                      className="chart-swatch"
                      style={{ background: categoryColor(index, chart.color) }}
                    />
                    <span className="chart-legend-label">{row.label}</span>
                    <span className="tabular-nums">
                      {row.value === null
                        ? "—"
                        : numberFormat.format(row.value)}
                    </span>
                  </Button>
                ))
              ) : (
                <span>
                  <i
                    className="chart-swatch"
                    style={{ background: chartColors[chart.color] }}
                  />
                  {metric}
                </span>
              )}
            </div>
          )}
        </>
      )}
      {!!rows.length && (
        <ChartDataTable
          rows={rows}
          chart={chart}
          metric={metric}
          categoryName={categoryName}
          tooMany={tooMany}
          select={select}
        />
      )}
      {selection && (
        <ChartEntryDialog
          key={selection.id}
          pageId={pageId}
          config={config}
          query={query}
          selection={selection}
          onClose={() => setSelection(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
