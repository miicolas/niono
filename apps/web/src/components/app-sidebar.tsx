import { useState, useMemo } from "react";
import {
  Search,
  Home,
  Settings2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  GripVertical,
  LogOut,
  FilePlus2,
  Copy,
  Star,
  ArrowUpRight,
  Table2,
  LayoutTemplate,
  ChevronsUpDown,
} from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  Sidebar,
  useSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUI } from "@/lib/ui-store";
import type { PageItem, Bootstrap } from "@/features/workspace/types";
import { sortedFavorites } from "@/features/workspace/sorted-favorites";

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
  const [name, setName] = useState("");
  const workspace = props.bootstrap.workspaces.find(
    (w) => w.id === props.workspaceId,
  );
  const isViewer = workspace?.role === "viewer";
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, PageItem[]>();
    for (const page of props.pages) {
      const siblings = map.get(page.parentId) ?? [];
      siblings.push(page);
      map.set(page.parentId, siblings);
    }
    return map;
  }, [props.pages]);
  const roots = childrenByParent.get(null) ?? [];
  const favorites = sortedFavorites(props.pages);
  return (
    <Sidebar className="workspace-sidebar border-r-0">
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="workspace-switcher">
              <span className="brand-mark small">D</span>
              <span className="name">{workspace?.name ?? "Mon espace"}</span>
              <ChevronsUpDown size={13} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Vos espaces de travail</DropdownMenuLabel>
            {props.bootstrap.workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => switchWorkspace(w.id)}
              >
                <span className="avatar">{w.name[0]}</span>
                {w.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setNewWorkspace(true)}>
              <Plus />
              Créer un espace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setPanel("search")}>
              <Search />
              <span>Rechercher</span>
              <span className="shortcut">⌘ K</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={!props.currentId}
              onClick={() => navigate(null)}
            >
              <Home />
              <span>Accueil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {favorites.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Favoris</SidebarGroupLabel>
            <SidebarMenu>
              {favorites.map((page) => (
                <SidebarMenuItem key={page.id}>
                  <button
                    className="favorite-up"
                    aria-label={`Monter ${page.title} dans les favoris`}
                    onClick={() => props.onAction("favorite-up", page)}
                  >
                    ↑
                  </button>
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
              <button
                className="icon-button ml-auto"
                aria-label="Créer une page"
                onClick={() => props.onCreate()}
              >
                <Plus size={13} />
              </button>
            )}
          </SidebarGroupLabel>
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
            <button
              className="list-row muted w-full"
              onClick={() => props.onCreate()}
            >
              <Plus size={15} />
              Nouvelle page
            </button>
          )}
          {!roots.length && (
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
            <span className="avatar">
              {props.bootstrap.user.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{props.bootstrap.user.name}</span>
            <button
              className="icon-button"
              aria-label="Se déconnecter"
              onClick={props.onLogout}
            >
              <LogOut size={14} />
            </button>
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
          <form
            className="panel-form"
            onSubmit={async (e) => {
              e.preventDefault();
              await props.onNewWorkspace(name);
              setNewWorkspace(false);
              setName("");
            }}
          >
            <Input
              aria-label="Nom de l’espace"
              autoFocus
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Le nom de votre espace"
            />
            <Button type="submit">Créer l’espace</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
function TreePage({
  page,
  index,
  readonly,
  childrenByParent,
  ...props
}: Props & {
  page: PageItem;
  index: number;
  readonly: boolean;
  childrenByParent: Map<string | null, PageItem[]>;
}) {
  const expanded = useUI((s) => s.expanded[page.id]);
  const toggle = useUI((s) => s.toggleExpanded);
  const children = childrenByParent.get(page.id) ?? [];
  const { ref, handleRef, isDragging } = useSortable({
    id: page.id,
    index,
    group: page.parentId ?? "root",
    disabled: readonly,
  });
  return (
    <div ref={ref} className={isDragging ? "dragging" : ""}>
      <div
        className={`tree-row ${props.currentId === page.id ? "active" : ""}`}
      >
        <button
          className="tree-chevron"
          aria-label={`${expanded ? "Replier" : "Déplier"} ${page.title}`}
          onClick={() => toggle(page.id)}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <button className="page-link" onClick={() => props.onNavigate(page.id)}>
          <span>
            {page.kind === "database" ? <Table2 size={14} /> : page.icon}
          </span>
          <span>{page.title || "Sans titre"}</span>
        </button>
        {!readonly && (
          <>
            <button
              ref={handleRef}
              className="icon-button row-action"
              aria-label={`Déplacer ${page.title}`}
            >
              <GripVertical size={12} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="icon-button row-action"
                  aria-label={`Actions pour ${page.title}`}
                >
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem onClick={() => props.onCreate(page.id)}>
                  <FilePlus2 />
                  Ajouter une sous-page
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => props.onAction("favorite", page)}
                >
                  <Star />
                  {page.favorite
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => props.onAction("duplicate", page)}
                >
                  <Copy />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => props.onAction("move", page)}>
                  <ArrowUpRight />
                  Déplacer vers…
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => props.onAction("trash", page)}
                >
                  <Trash2 />
                  Mettre à la corbeille
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      {expanded && (
        <div className="tree-children">
          {children.map((child, i) => (
            <TreePage
              key={child.id}
              page={child}
              childrenByParent={childrenByParent}
              index={i}
              {...props}
              readonly={readonly}
            />
          ))}
          {!children.length && (
            <span className="sidebar-helper">Aucune sous-page</span>
          )}
        </div>
      )}
    </div>
  );
}
