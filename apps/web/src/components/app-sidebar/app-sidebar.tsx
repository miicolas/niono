import { z } from "zod";
import { ActionForm } from "@/components/action-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings2, Trash2, Plus, LogOut, LayoutTemplate } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Props } from "./shared";
import { TreePage } from "./tree-page";
import { useAppSidebar } from "./use-app-sidebar";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function AppSidebar(initialProps: Props) {
  const {
    workspace,
    props,
    setOpenMobile,
    setNewWorkspace,
    setPanel,
    navigate,
    codex,
    favorites,
    isViewer,
    roots,
    childrenByParent,
    newWorkspace,
  } = useAppSidebar(initialProps);
  return (
    <Sidebar className="workspace-sidebar border-r-0">
      <WorkspaceSwitcher
        workspace={workspace}
        props={props}
        setOpenMobile={setOpenMobile}
        setNewWorkspace={setNewWorkspace}
        setPanel={setPanel}
        navigate={navigate}
        codex={codex}
      />
      <SidebarContent>
        {favorites.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Favoris</SidebarGroupLabel>
            <SidebarMenu>
              {favorites.map((page) => (
                <SidebarMenuItem key={page.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="favorite-up"
                    aria-label={`Monter ${page.title} dans les favoris`}
                    onClick={() => props.onAction("favorite-up", page)}
                  >
                    ↑
                  </Button>
                  <SidebarMenuButton
                    isActive={props.currentId === page.id}
                    onClick={() => navigate(page.id)}
                  >
                    <span>{page.icon}</span>
                    <span>{page.title || "Sans titre"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Pages de l’espace</span>
            {!isViewer && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="icon-button ml-auto"
                aria-label="Créer une page"
                onClick={() => props.onCreate()}
              >
                <Plus size={13} />
              </Button>
            )}
          </SidebarGroupLabel>
          {props.pagesLoading && (
            <div className="space-y-4 px-2 py-3" role="status">
              <span className="sr-only">Chargement des pages…</span>
              <div aria-hidden="true" className="space-y-4">
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          )}
          <DragDropProvider
            onDragEnd={(event) => {
              if (event.canceled) return;
              const { source, target } = event.operation;
              if (source && target && source.id !== target.id) {
                const targetPage = props.pages.find((p) => p.id === target.id);
                if (targetPage)
                  props.onMove(
                    String(source.id),
                    targetPage.parentId,
                    targetPage.id,
                  );
              }
            }}
          >
            {roots.map((page, index) => (
              <TreePage
                key={page.id}
                page={page}
                childrenByParent={childrenByParent}
                index={index}
                {...props}
                onNavigate={navigate}
                readonly={isViewer}
              />
            ))}
          </DragDropProvider>
          {!isViewer && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="list-row muted w-full"
              onClick={() => props.onCreate()}
            >
              <Plus size={15} />
              Nouvelle page
            </Button>
          )}
          {!roots.length && !props.pagesLoading && !props.pagesUnavailable && (
            <p className="sidebar-helper">
              Un espace à remplir d’idées.
              <br />
              Créez votre première page.
            </p>
          )}
        </SidebarGroup>
        <div className="workspace-bottom">
          <SidebarMenu>
            {[
              { icon: LayoutTemplate, label: "Modèles", panel: "templates" },
              { icon: Settings2, label: "Paramètres", panel: "settings" },
              { icon: Trash2, label: "Corbeille", panel: "trash" },
            ].map((item) => (
              <SidebarMenuItem key={item.panel}>
                <SidebarMenuButton
                  onClick={() =>
                    setPanel(item.panel as "templates" | "settings" | "trash")
                  }
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="profile-row">
            <Avatar className="avatar">
              <AvatarFallback>
                {props.bootstrap.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate">{props.bootstrap.user.name}</span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="icon-button"
              aria-label="Se déconnecter"
              onClick={props.onLogout}
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </SidebarContent>
      <SidebarRail />
      <Dialog open={newWorkspace} onOpenChange={setNewWorkspace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Un nouvel espace</DialogTitle>
            <DialogDescription>
              Pour un projet, une équipe ou simplement vous.
            </DialogDescription>
          </DialogHeader>
          <ActionForm
            schema={z.object({
              name: z.string().trim().min(1, "Saisissez un nom.").max(100),
            })}
            defaultValues={{ name: "" }}
            fields={[
              {
                name: "name",
                label: "Nom de l’espace",
                placeholder: "Le nom de votre espace",
                maxLength: 100,
              },
            ]}
            submitLabel="Créer l’espace"
            onSubmit={async ({ name }) => {
              await props.onNewWorkspace(name);
              setNewWorkspace(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
