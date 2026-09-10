import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Sun, Moon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { type WorkspaceState } from "./shared";

export function WorkspaceTopbar({
  go,
  workspace,
  current,
  pages,
  theme,
  setTheme,
}: Pick<
  WorkspaceState,
  "go" | "workspace" | "current" | "pages" | "theme" | "setTheme"
>) {
  return (
    <header className="topbar">
      <SidebarTrigger />
      <Breadcrumb className="breadcrumbs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void go(null)}
              >
                {workspace?.name}
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {current && (
            <>
              <BreadcrumbSeparator />
              {current.parentId && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void go(current.parentId)}
                      >
                        {pages.data?.find(
                          (page) => page.id === current.parentId,
                        )?.title ?? "Page"}
                      </Button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="current">
                  {current.icon} {current.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="topbar-actions">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="icon-button"
          aria-label={
            theme === "dark"
              ? "Passer au thème papier"
              : "Passer au thème sombre"
          }
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </div>
    </header>
  );
}
