import type { PageItem } from "../types";
import { useWorkspace } from "./use-workspace";

export type WorkspaceSearch = {
  w?: string;
  p?: string;
  view?: string;
  invite?: string;
};

export type WorkspaceAppProps = { search: WorkspaceSearch };

export type WorkspaceState = ReturnType<typeof useWorkspace> & {
  current: PageItem | undefined;
  workspace:
    | NonNullable<
        ReturnType<typeof useWorkspace>["bootstrap"]["data"]
      >["workspaces"][number]
    | undefined;
};
