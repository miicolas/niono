import { Home, Search } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
export function SidebarQuickActions({
  isHome,
  onSearch,
  onHome,
}: {
  isHome: boolean;
  onSearch: () => void;
  onHome: () => void;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={onSearch}>
          <Search />
          <span>Rechercher</span>
          <span className="shortcut">⌘ K</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isHome} onClick={onHome}>
          <Home />
          <span>Accueil</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
