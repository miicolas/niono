import type { PageItem, Bootstrap } from "@/features/workspace/types";

export type Props = {
  pages: PageItem[];
  pagesLoading?: boolean;
  pagesUnavailable?: boolean;
  currentId: string | null;
  workspaceId: string;
  bootstrap: Bootstrap;
  onNavigate: (id: string | null) => void;
  onCreate: (parentId?: string, kind?: "page" | "database") => void;
  onWorkspace: (id: string) => void;
  onNewWorkspace: (name: string) => Promise<void>;
  onAction: (action: string, page: PageItem) => void;
  onMove: (id: string, parentId: string | null, beforeId?: string) => void;
  onLogout: () => void;
};

export const SEARCH_HOTKEY = "Mod+K";
