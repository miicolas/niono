import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Moon, Sun } from "lucide-react";
import { SelectField } from "@/components/ui/select-field";
import { SelectItem } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsHeading } from "./settings-heading";
import { type SettingsViewProps } from "./settings-view-props";

export function GeneralSettings({
  theme,
  setTheme,
  workspace,
}: Pick<SettingsViewProps, "theme" | "setTheme" | "workspace">) {
  return (
    <TabsContent value="general" className="settings-page">
      <SettingsHeading
        title="Général"
        description="Un espace de travail qui vous ressemble."
      />
      <section
        className="settings-section"
        aria-labelledby="settings-appearance"
      >
        <div className="settings-section-row">
          <div>
            <h3 id="settings-appearance">Apparence</h3>
            <p>Choisissez l’ambiance de votre espace.</p>
          </div>
          <SelectField
            aria-label="Apparence"
            value={theme}
            onValueChange={(value) =>
              setTheme(value === "dark" ? "dark" : "light")
            }
          >
            <SelectItem value="dark">
              <Moon aria-hidden="true" /> Sombre
            </SelectItem>
            <SelectItem value="light">
              <Sun aria-hidden="true" /> Papier
            </SelectItem>
          </SelectField>
        </div>
        <div className="settings-theme-options" aria-hidden="true">
          {(
            [
              { id: "dark", label: "Sombre", icon: Moon },
              { id: "light", label: "Papier", icon: Sun },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <div
              className="settings-theme-option"
              data-selected={theme === id}
              key={id}
            >
              <div className="settings-theme-preview" data-theme={id}>
                <div className="settings-preview-sidebar">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="settings-preview-page">
                  <span />
                  <strong />
                  <i />
                  <i />
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <div className="settings-theme-caption">
                <Icon size={15} />
                <span>{label}</span>
                {theme === id && <Check size={15} />}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        className="settings-section"
        aria-labelledby="settings-workspace"
      >
        <h3 id="settings-workspace">Votre espace de travail</h3>
        <div className="settings-workspace-card">
          <span className="settings-workspace-avatar" aria-hidden="true">
            {workspace?.name.slice(0, 1).toLocaleUpperCase("fr")}
          </span>
          <div>
            <strong>{workspace?.name}</strong>
            <p>Votre espace actuel sur DigiPM</p>
          </div>
          <Badge variant="secondary" className="settings-badge">
            {workspace?.role
              .split(",")
              .map(
                (role) =>
                  ({
                    owner: "Propriétaire",
                    admin: "Administrateur",
                    member: "Membre",
                    editor: "Éditeur",
                    viewer: "Lecteur",
                  })[
                    role as "owner" | "admin" | "member" | "editor" | "viewer"
                  ] ?? role,
              )
              .join(", ")}
          </Badge>
        </div>
      </section>
      <div className="settings-note">
        <CheckCheck size={17} aria-hidden="true" />
        <p>
          Vos contenus sont enregistrés automatiquement. En cas de coupure,
          votre brouillon reste sur cet appareil.
        </p>
      </div>
    </TabsContent>
  );
}
