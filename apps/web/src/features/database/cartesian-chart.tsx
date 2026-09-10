import { useMemo } from "react";
import { barX, barY, defineChart, dot, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import {
  chartColors,
  numberFormat,
  type ChartRendererProps,
} from "./chart-data";

export function CartesianChart({
  rows,
  config,
  metric,
  category,
  onSelect,
}: ChartRendererProps) {
  const horizontal = config.type === "horizontalBar";
  const definition = useMemo(() => {
    const maximum = Math.max(0, ...rows.map((row) => row.value ?? 0));
    const labels = new Map(rows.map((r) => [r.id, r.label]));
    const band = {
      scale: () => scaleBand<string>().padding(0.32),
      domain: rows.map((r) => r.id),
      axis: {
        label: category,
        ticks: {
          format: (id: string) => {
            const label = labels.get(id) ?? id;
            return label.length > 24 ? `${label.slice(0, 22)}…` : label;
          },
        },
      },
    };
    const numeric = {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: {
        label: metric,
        ticks: {
          ...(config.aggregation === "count" && maximum <= 10
            ? { values: Array.from({ length: maximum + 1 }, (_, i) => i) }
            : {}),
          format: (value: number) => numberFormat.format(value),
        },
      },
    };
    const color = chartColors[config.color];
    const options = { x: "id", y: "value", key: "id" } as const;
    return defineChart({
      marks: horizontal
        ? [
            barX(rows, {
              x: "value",
              y: "id",
              key: "id",
              fill: color,
              radius: 3,
              maxThickness: 52,
            }),
          ]
        : config.type === "line"
          ? [
              lineY(rows, { ...options, stroke: color, strokeWidth: 2.5 }),
              dot(rows, { ...options, fill: color, r: 4 }),
            ]
          : [
              barY(rows, {
                ...options,
                fill: color,
                radius: 3,
                maxThickness: 72,
              }),
            ],
      scales: horizontal
        ? { x: numeric, y: band }
        : {
            x:
              config.type === "line"
                ? { ...band, scale: () => scalePoint<string>().padding(0.5) }
                : band,
            y: numeric,
          },
      tooltip: {
        use: tooltip,
        items: [
          { field: "label", label: category },
          {
            field: "value",
            label: metric,
            text: (point) =>
              point.datum.value === null
                ? "Aucune valeur"
                : numberFormat.format(point.datum.value),
          },
        ],
      },
    });
  }, [
    rows,
    config.type,
    config.color,
    config.aggregation,
    metric,
    category,
    horizontal,
  ]);
  return (
    <Chart
      definition={definition}
      height={horizontal ? Math.max(340, rows.length * 36 + 75) : 360}
      ariaLabel={`${metric} par ${category}`}
      ariaDescription="Utilisez les flèches pour parcourir les valeurs et Entrée pour ouvrir les pages correspondantes."
      onSelect={(point) => {
        if (point) onSelect(point.datum);
      }}
    />
  );
}
