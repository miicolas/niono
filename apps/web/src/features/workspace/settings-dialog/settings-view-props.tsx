import { useUI } from "@/lib/ui-store";
import type { Bootstrap } from "../types";

export type SettingsViewProps = {
  canEdit: boolean;
  bootstrap: Bootstrap;
  workspace: Bootstrap["workspaces"][number] | undefined;
  theme: ReturnType<typeof useUI.getState>["theme"];
  setTheme: ReturnType<typeof useUI.getState>["setTheme"];
};
