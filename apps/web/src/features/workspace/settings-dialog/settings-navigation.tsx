import { SettingsTabGroup } from "./settings-tab-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TabsList } from "@/components/ui/tabs";
import { personalTabs, workspaceTabs } from "./shared";
import { type SettingsViewProps } from "./settings-view-props";

export function SettingsNavigation({
  canEdit,
  bootstrap,
}: Pick<SettingsViewProps, "canEdit" | "bootstrap">) {
  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-title" aria-hidden="true">
        Paramètres
      </div>
      <TabsList
        className="settings-navigation"
        aria-label="Rubriques des paramètres"
      >
        <SettingsTabGroup
          label="Votre compte"
          group="personal"
          tabs={personalTabs}
        />
        <SettingsTabGroup
          label="Espace de travail"
          group="workspace"
          tabs={workspaceTabs.filter((tab) => tab.id !== "import" || canEdit)}
        />
      </TabsList>
      <div className="settings-identity">
        <Avatar className="settings-avatar" aria-hidden="true">
          <AvatarFallback>
            {bootstrap.user.name.slice(0, 1).toLocaleUpperCase("fr")}
          </AvatarFallback>
        </Avatar>
        <div>
          <strong>{bootstrap.user.name}</strong>
          <span>{bootstrap.user.email}</span>
        </div>
      </div>
    </aside>
  );
}
