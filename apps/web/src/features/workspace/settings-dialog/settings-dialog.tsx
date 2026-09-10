import { OrganizationSettings } from "../organization-settings";
import { canEditWorkspace } from "@digipm/server/permissions";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileUp, LockKeyhole } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  AccountSettings,
  PasswordSettings,
} from "@/features/auth/account-settings";
import { CodexSettings } from "@/features/codex/codex-settings";
import { useUI } from "@/lib/ui-store";
import { ImportPanel } from "../import-panel";
import type { Bootstrap } from "../types";
import "../settings.css";
import { SettingsHeading } from "./settings-heading";
import { SettingsNavigation } from "./settings-navigation";
import { GeneralSettings } from "./general-settings";

export function SettingsDialog({
  open,
  onClose,
  workspaceId,
  bootstrap,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  bootstrap: Bootstrap;
  onImported: (id: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState("general");
  const contentRef = useRef<HTMLDivElement>(null);
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const cache = useQueryClient();
  const workspace = bootstrap.workspaces.find((w) => w.id === workspaceId);
  const canEdit = canEditWorkspace(workspace?.role);
  const selectedTab =
    activeTab === "import" && !canEdit ? "general" : activeTab;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="settings-dialog">
        <DialogTitle className="sr-only">Paramètres</DialogTitle>
        <DialogDescription className="sr-only">
          Gérez votre compte et les préférences de l’espace {workspace?.name}.
        </DialogDescription>
        <Tabs
          orientation="vertical"
          value={selectedTab}
          onValueChange={(value) => {
            setActiveTab(value);
            contentRef.current?.scrollTo({ top: 0 });
          }}
          className="settings-layout"
        >
          <SettingsNavigation canEdit={canEdit} bootstrap={bootstrap} />
          <div className="settings-main" ref={contentRef}>
            <GeneralSettings
              theme={theme}
              setTheme={setTheme}
              workspace={workspace}
            />
            <TabsContent
              value="account"
              className="settings-page"
              forceMount
              hidden={selectedTab !== "account"}
            >
              <SettingsHeading
                title="Mon profil"
                description="Les informations associées à votre compte DigiPM."
              />
              <AccountSettings
                name={bootstrap.user.name}
                email={bootstrap.user.email}
                emailVerified={bootstrap.user.emailVerified}
                onUpdated={async () => {
                  await cache.invalidateQueries({ queryKey: ["bootstrap"] });
                }}
              />
            </TabsContent>
            <TabsContent
              value="security"
              className="settings-page"
              forceMount
              hidden={selectedTab !== "security"}
            >
              <SettingsHeading
                title="Sécurité"
                description="Gardez le contrôle de l’accès à votre compte."
              />
              <PasswordSettings />
            </TabsContent>
            <TabsContent value="codex" className="settings-page">
              <SettingsHeading
                title="Codex"
                description="Votre assistant, connecté à votre compte personnel."
              />
              <div className="settings-connection">
                <CodexSettings />
              </div>
              <div className="settings-note">
                <LockKeyhole size={17} aria-hidden="true" />
                <p>
                  Votre connexion et vos conversations restent personnelles,
                  même dans un espace partagé.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="members" className="settings-page">
              <SettingsHeading
                title="Membres"
                description="Retrouvez votre équipe et gérez les accès à cet espace."
              />
              <OrganizationSettings
                key={`${workspaceId}:members`}
                organizationId={workspaceId}
                userId={bootstrap.user.id}
                tab="members"
              />
            </TabsContent>
            <TabsContent value="teams" className="settings-page">
              <SettingsHeading
                title="Équipes"
                description="Organisez les membres de votre espace en équipes."
              />
              <OrganizationSettings
                key={`${workspaceId}:teams`}
                organizationId={workspaceId}
                userId={bootstrap.user.id}
                tab="teams"
              />
            </TabsContent>
            {canEdit && (
              <TabsContent
                value="import"
                className="settings-page"
                forceMount
                hidden={selectedTab !== "import"}
              >
                <SettingsHeading
                  title="Importer du contenu"
                  description="Donnez une nouvelle place à vos documents."
                />
                <section className="settings-section">
                  <div className="settings-import-heading">
                    <span className="settings-workspace-avatar">
                      <FileUp size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>Depuis un fichier</h3>
                      <p>Markdown, texte, CSV ou archive DigiPM.</p>
                    </div>
                  </div>
                  <ImportPanel workspaceId={workspaceId} onDone={onImported} />
                </section>
                <div className="settings-note">
                  <FileUp size={17} aria-hidden="true" />
                  <p>
                    Pour exporter du contenu, ouvrez le menu d’une page et
                    choisissez le format souhaité.
                  </p>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
