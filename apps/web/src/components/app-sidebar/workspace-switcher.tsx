import type { AppSidebarState } from "./app-sidebar-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OpenAILogo } from "@/components/openai-logo";
import { Search, Home, Plus, ChevronsUpDown } from "lucide-react";
import {
  SidebarHeader,
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
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { Shortcut } from "@/components/shortcut";
import { SEARCH_HOTKEY } from "./shared";

export function WorkspaceSwitcher({
  workspace,
  props,
  setOpenMobile,
  setNewWorkspace,
  setPanel,
  navigate,
  codex,
}: Pick<
  AppSidebarState,
  | "workspace"
  | "props"
  | "setOpenMobile"
  | "setNewWorkspace"
  | "setPanel"
  | "navigate"
  | "codex"
>) {
  return (
    <SidebarHeader>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="workspace-switcher"
          >
            <BrandLogo className="small" />
            <span className="name">{workspace?.name ?? "Mon espace"}</span>
            <ChevronsUpDown size={13} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Vos espaces de travail</DropdownMenuLabel>
          {props.bootstrap.workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => {
                props.onWorkspace(w.id);
                setOpenMobile(false);
              }}
            >
              <Avatar className="avatar">
                <AvatarFallback>{w.name[0]}</AvatarFallback>
              </Avatar>
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
            <Shortcut hotkey={SEARCH_HOTKEY} />
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
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={codex.open}
            onClick={() => {
              codex.setOpen(true);
              setOpenMobile(false);
            }}
          >
            <OpenAILogo />
            <span>Codex</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
