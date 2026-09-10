import type { ChartConfig } from "@digipm/contracts";

export type ChartDatum = {
  id: string;
  key: string | null;
  label: string;
  value: number | null;
  count: number;
};
export const chartColors = {
  blue: "#5b9bd5",
  green: "#62a883",
  orange: "#d99b57",
  purple: "#a28acf",
  pink: "#cb829c",
};
export const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});
export function categoryColor(index: number, color: ChartConfig["color"]) {
  const colors = Object.values(chartColors);
  return colors[(colors.indexOf(chartColors[color]) + index) % colors.length]!;
}

export type ChartRendererProps = {
  rows: ChartDatum[];
  config: ChartConfig;
  metric: string;
  category: string;
  onSelect: (row: ChartDatum) => void;
};
