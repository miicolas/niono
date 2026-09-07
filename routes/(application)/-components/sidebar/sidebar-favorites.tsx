import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { PageItem } from "@/routes/(application)/-lib/types";
export function SidebarFavorites({
  favorites,
  currentId,
  onNavigate,
  onAction,
}: {
  favorites: PageItem[];
  currentId: string | null;
  onNavigate: (id: string) => void;
  onAction: (action: string, page: PageItem) => void;
}) {
  if (!favorites.length) {
    return null;
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Favoris</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((page) => (
          <SidebarMenuItem key={page.id}>
            <button
              aria-label={`Monter ${page.title} dans les favoris`}
              className="favorite-up"
              onClick={() => onAction("favorite-up", page)}
              type="button"
            >
              ↑
            </button>
            <SidebarMenuButton
              isActive={currentId === page.id}
              onClick={() => onNavigate(page.id)}
            >
              <span>{page.icon}</span>
              <span>{page.title || "Sans titre"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
