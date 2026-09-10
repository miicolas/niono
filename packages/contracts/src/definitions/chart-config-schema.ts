import { z } from "zod";

export const chartConfigSchema = z
  .object({
    type: z.enum(["bar", "horizontalBar", "line", "donut"]).default("bar"),
    xProperty: z.string().min(1).max(100).default("title"),
    aggregation: z
      .enum(["count", "sum", "average", "min", "max"])
      .default("count"),
    metricProperty: z.string().min(1).max(100).optional(),
    dateBucket: z.enum(["day", "week", "month", "year"]).default("month"),
    sort: z
      .enum(["categoryAsc", "categoryDesc", "valueAsc", "valueDesc"])
      .default("categoryAsc"),
    color: z
      .enum(["blue", "green", "orange", "purple", "pink"])
      .default("blue"),
    showLegend: z.boolean().default(true),
  })
  .refine((chart) => chart.aggregation === "count" || !!chart.metricProperty, {
    message: "Choisissez une propriété numérique pour ce calcul.",
    path: ["metricProperty"],
  });
