import type { Bootstrap } from "../types";
import { useWorkspacePanels } from "./use-workspace-panels";

export type WorkspacePanelsProps = {
  workspaceId: string;
  bootstrap: Bootstrap;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
};

export type WorkspacePanelsState = ReturnType<typeof useWorkspacePanels>;
