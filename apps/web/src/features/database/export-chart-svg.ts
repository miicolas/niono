import { download } from "@/lib/download";
import {
  categoryColor,
  chartColors,
  numberFormat,
  type ChartDatum,
} from "./chart-data";
import type { ChartConfig } from "@digipm/contracts";

export function exportChartSvg(
  plot: HTMLDivElement | null,
  name: string,
  rows: ChartDatum[],
  chart: ChartConfig,
  metric: string,
) {
  const svg = plot?.querySelector<SVGSVGElement>("svg.ts-chart");
  if (!svg) return;
  const copy = svg.cloneNode(true) as SVGElement;
  const originals = [svg, ...svg.querySelectorAll("*")];
  const clones = [copy, ...copy.querySelectorAll("*")];
  originals.forEach((node, i) => {
    const style = getComputedStyle(node);
    for (const property of [
      "fill",
      "stroke",
      "stroke-width",
      "color",
      "font-family",
      "font-size",
      "font-weight",
      "opacity",
    ])
      clones[i]?.setAttribute(property, style.getPropertyValue(property));
  });
  copy.style.background = getComputedStyle(plot!).getPropertyValue(
    "--background",
  );
  const width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
  const height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
  const ns = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(ns, "g");
  while (copy.firstChild) group.append(copy.firstChild);
  group.setAttribute("transform", "translate(0 50)");
  copy.append(group);
  copy.setAttribute(
    "viewBox",
    `0 0 ${width} ${height + 90 + rows.length * 24}`,
  );
  copy.setAttribute("width", String(width));
  copy.setAttribute("height", String(height + 90 + rows.length * 24));
  const foreground = getComputedStyle(plot!).getPropertyValue("--foreground");
  const label = (
    value: string,
    x: number,
    y: number,
    size = 12,
    anchor = "start",
  ) => {
    const text = document.createElementNS(ns, "text");
    text.textContent = value;
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y));
    text.setAttribute("fill", foreground);
    text.setAttribute("font-size", String(size));
    text.setAttribute("text-anchor", anchor);
    text.setAttribute("font-family", "system-ui, sans-serif");
    copy.append(text);
  };
  label(name, 16, 22, 16);
  label(metric, 16, 42);
  const labelLength = Math.max(12, Math.floor((width - 140) / 7));
  rows.forEach((row, index) => {
    const y = height + 78 + index * 24;
    const swatch = document.createElementNS(ns, "rect");
    swatch.setAttribute("x", "16");
    swatch.setAttribute("y", String(y - 9));
    swatch.setAttribute("width", "9");
    swatch.setAttribute("height", "9");
    swatch.setAttribute("rx", "2");
    swatch.setAttribute(
      "fill",
      chart.type === "donut"
        ? categoryColor(index, chart.color)
        : chartColors[chart.color],
    );
    copy.append(swatch);
    label(
      row.label.length > labelLength
        ? `${row.label.slice(0, labelLength)}…`
        : row.label,
      34,
      y,
    );
    label(
      row.value === null ? "—" : numberFormat.format(row.value),
      width - 16,
      y,
      12,
      "end",
    );
  });
  const description = document.createElementNS(ns, "desc");
  description.textContent = rows
    .map((row) => `${row.label} : ${row.value ?? "Aucune valeur"}`)
    .join(" ; ");
  copy.prepend(description);
  download(
    `${name}.svg`,
    new XMLSerializer().serializeToString(copy),
    "image/svg+xml;charset=utf-8",
  );
}
