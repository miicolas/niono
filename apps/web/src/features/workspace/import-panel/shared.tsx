import { type PropertyType } from "@digipm/contracts";
import { useImportPanel } from "./use-import-panel";

export type Csv = {
  headers: string[];
  rows: string[][];
  types: PropertyType[];
};

export type ImportPanelProps = {
  workspaceId: string;
  onDone: (id: string) => Promise<void>;
};

export type ImportPanelState = ReturnType<typeof useImportPanel>;
