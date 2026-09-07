import { SidebarTrigger } from "@/components/ui/sidebar";
import type { PageItem } from "@/routes/(application)/-lib/types";
import { ThemeToggle } from "./theme-toggle";
import { WorkspaceBreadcrumbs } from "./workspace-breadcrumbs";
export function WorkspaceTopbar({
  workspaceName,
  current,
  pages,
  onNavigate,
}: {
  workspaceName?: string;
  current?: PageItem;
  pages: PageItem[];
  onNavigate: (id: string | null) => void;
}) {
  return (
    <header className="topbar">
      <SidebarTrigger />
      <WorkspaceBreadcrumbs
        current={current}
        onNavigate={onNavigate}
        pages={pages}
        workspaceName={workspaceName}
      />
      <div className="topbar-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
