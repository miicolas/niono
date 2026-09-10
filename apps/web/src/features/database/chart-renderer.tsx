import { CartesianChart } from "./cartesian-chart";
import { DonutChart } from "./donut-chart";
import type { ChartRendererProps } from "./chart-data";

export function ChartRenderer(props: ChartRendererProps) {
  return props.config.type === "donut" ? (
    <DonutChart {...props} />
  ) : (
    <CartesianChart {...props} />
  );
}
