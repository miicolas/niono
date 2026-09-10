import { useMemo } from "react";
import { defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { tooltip } from "@tanstack/charts/tooltip";
import {
  categoryColor,
  numberFormat,
  type ChartRendererProps,
} from "./chart-data";

export function DonutChart({
  rows,
  config,
  metric,
  category,
  onSelect,
}: ChartRendererProps) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          polar({
            inset: 10,
            radiusRatio: 0.88,
            marks: [
              radialArc(pie(rows, { value: "value", gapAngle: 0.025 }), {
                innerRadius: ({ radius }) => radius * 0.67,
                cornerRadius: 3,
                color: "id",
                key: "id",
              }),
            ],
            scales: { angle: null, radius: null },
          }),
        ],
        scales: { x: null, y: null },
        color: {
          domain: rows.map((r) => r.id),
          range: rows.map((_, i) => categoryColor(i, config.color)),
        },
        tooltip: {
          use: tooltip,
          items: [
            { field: "label", label: category },
            {
              field: "value",
              label: metric,
              text: (point) => numberFormat.format(point.datum.value),
            },
          ],
        },
      }),
    [rows, config.color, category, metric],
  );
  return (
    <Chart
      definition={definition}
      height={360}
      ariaLabel={`${metric} par ${category}, anneau`}
      ariaDescription="Utilisez les flèches pour parcourir les parts et Entrée pour ouvrir les pages correspondantes."
      onSelect={(point) => {
        if (point) {
          const row = rows.find((r) => r.id === point.datum.id);
          if (row) onSelect(row);
        }
      }}
    />
  );
}
