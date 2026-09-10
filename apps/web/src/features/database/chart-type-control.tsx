import type { ChartConfig } from "@digipm/contracts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, ChartBar, ChartLine, Donut } from "lucide-react";

export const chartTypes = [
  { id: "bar", name: "Barres verticales", icon: BarChart3 },
  { id: "horizontalBar", name: "Barres horizontales", icon: ChartBar },
  { id: "line", name: "Courbe", icon: ChartLine },
  { id: "donut", name: "Anneau", icon: Donut },
] as const;
export function ChartTypeControl({
  value,
  onChange,
  presentation = "compact",
}: {
  presentation?: "compact" | "previews";
  value: ChartConfig["type"];
  onChange: (type: ChartConfig["type"]) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant={presentation === "previews" ? "default" : "outline"}
      className={
        presentation === "previews" ? "chart-type-previews" : undefined
      }
      value={value}
      aria-label="Type de graphique"
      onValueChange={(next) => {
        const type = chartTypes.find((item) => item.id === next);
        if (type) onChange(type.id);
      }}
    >
      {chartTypes.map(({ id, name, icon: Icon }) => (
        <ToggleGroupItem key={id} value={id} aria-label={name} title={name}>
          <Icon size={presentation === "previews" ? 24 : 16} />
          {presentation === "previews" && (
            <span>
              {id === "bar"
                ? "Vertical"
                : id === "horizontalBar"
                  ? "Horizontal"
                  : name}
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
