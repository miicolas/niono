import {
  chartConfigSchema,
  chartPropertyTypes,
  type ViewConfig,
} from "@digipm/contracts";
import { schema as s } from "@digipm/db";
import { ORPCError } from "@orpc/server";

type Property = typeof s.properties.$inferSelect;

export function validateChart(config: ViewConfig, properties: Property[]) {
  const chart = chartConfigSchema.parse(config.chart ?? {});
  const x = properties.find((p) => p.id === chart.xProperty);
  if (
    chart.xProperty !== "title" &&
    (!x || !chartPropertyTypes.includes(x.type))
  )
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Choisissez une propriété simple pour les catégories du graphique.",
    });
  if (
    chart.metricProperty &&
    properties.find((p) => p.id === chart.metricProperty)?.type !== "number"
  )
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Le calcul du graphique nécessite une propriété numérique de cette base.",
    });
  return chart;
}
