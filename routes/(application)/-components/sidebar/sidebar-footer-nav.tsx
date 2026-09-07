import { LayoutTemplate, LogOut, Settings2, Trash2 } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type PanelName = "templates" | "settings" | "trash";
const items: {
  icon: typeof LayoutTemplate;
  label: string;
  panel: PanelName;
}[] = [
  { icon: LayoutTemplate, label: "Modèles", panel: "templates" },
  { icon: Settings2, label: "Paramètres", panel: "settings" },
  { icon: Trash2, label: "Corbeille", panel: "trash" },
];
export function SidebarFooterNav({
  userName,
  onPanel,
  onLogout,
}: {
  userName: string;
  onPanel: (panel: PanelName) => void;
  onLogout: () => void;
}) {
  return (
    <div className="workspace-bottom">
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.panel}>
            <SidebarMenuButton onClick={() => onPanel(item.panel)}>
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <div className="profile-row">
        <span className="avatar">{userName.slice(0, 2).toUpperCase()}</span>
        <span className="flex-1 truncate">{userName}</span>
        <button
          aria-label="Se déconnecter"
          className="icon-button"
          onClick={onLogout}
          type="button"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
