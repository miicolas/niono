import { type ViewConfig } from "@digipm/contracts";
import { type DatabaseProperty } from "./shared";

export type ViewControlsProps = {
  filtersOnly?: boolean;
  config: ViewConfig;
  properties: DatabaseProperty[];
  members: { id: string; name: string }[];
  onChange: (config: ViewConfig) => void;
  onAddProperty?: () => void;
  filterRequest: { id: string; key: number } | null;
};
