import { Settings2, X } from "lucide-react";
import type { ViewConfig } from "@digipm/contracts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChartSettings, type ChartProperty } from "./chart-settings";
import "./chart-settings.css";

export function ChartSettingsPopover({
  config,
  properties,
  onChange,
  open,
  onOpenChange,
}: {
  config: ViewConfig;
  properties: ChartProperty[];
  onChange: (value: ViewConfig) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Configurer le graphique"
          title="Configurer le graphique"
        >
          <Settings2 size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="chart-settings-popover"
        aria-label="Paramètres du graphique"
      >
        <div className="chart-settings-heading">
          <strong>Graphique</strong>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fermer les paramètres du graphique"
            onClick={() => onOpenChange(false)}
          >
            <X size={14} />
          </Button>
        </div>
        <ChartSettings
          config={config}
          properties={properties}
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}
