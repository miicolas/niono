import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUI } from "@/lib/ui/store";
import { sortedFavorites } from "@/routes/(application)/-lib/sorted-favorites";
import type { Bootstrap, PageItem } from "@/routes/(application)/-lib/types";
import { NewWorkspaceDialog } from "./new-workspace-dialog";
import { SidebarFavorites } from "./sidebar-favorites";
import { SidebarFooterNav } from "./sidebar-footer-nav";
import { SidebarPageTree } from "./sidebar-page-tree";
import { SidebarQuickActions } from "./sidebar-quick-actions";
import { WorkspaceSwitcher } from "./workspace-switcher";

type Props = {
  pages: PageItem[];
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
export function AppSidebar(props: Props) {
  const storePanel = useUI((s) => s.setPanel);
  const { setOpenMobile } = useSidebar();
  /** Wraps an action so the mobile sheet closes once it runs. */
  const closing =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A) => {
      fn(...args);
      setOpenMobile(false);
    };
  const setPanel = closing(storePanel);
  const navigate = closing(props.onNavigate);
  const switchWorkspace = closing(props.onWorkspace);
  const [newWorkspace, setNewWorkspace] = useState(false);
  const workspace = props.bootstrap.workspaces.find(
    (w) => w.id === props.workspaceId
  );
  const isViewer = workspace?.role === "viewer";
  return (
    <Sidebar className="workspace-sidebar border-r-0">
      <SidebarHeader>
        <WorkspaceSwitcher
          currentName={workspace?.name}
          onNew={() => setNewWorkspace(true)}
          onSwitch={switchWorkspace}
          workspaces={props.bootstrap.workspaces}
        />
        <SidebarQuickActions
          isHome={!props.currentId}
          onHome={() => navigate(null)}
          onSearch={() => setPanel("search")}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarFavorites
          currentId={props.currentId}
          favorites={sortedFavorites(props.pages)}
          onAction={props.onAction}
          onNavigate={navigate}
        />
        <SidebarPageTree
          currentId={props.currentId}
          onAction={props.onAction}
          onCreate={props.onCreate}
          onMove={props.onMove}
          onNavigate={navigate}
          pages={props.pages}
          readonly={isViewer}
        />
        <SidebarFooterNav
          onLogout={props.onLogout}
          onPanel={setPanel}
          userName={props.bootstrap.user.name}
        />
      </SidebarContent>
      <SidebarRail />
      <NewWorkspaceDialog
        onCreate={props.onNewWorkspace}
        onOpenChange={setNewWorkspace}
        open={newWorkspace}
      />
    </Sidebar>
  );
}
