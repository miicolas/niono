import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orpcClient } from "@/orpc/client";
import type { Bootstrap } from "@/routes/(application)/-lib/types";
import { bootstrapQuery } from "@/routes/(application)/-lib/workspace-queries";
import { SettingsAccountTab } from "./settings-account-tab";
import { SettingsGeneralTab } from "./settings-general-tab";
import { SettingsImportTab } from "./settings-import-tab";
import { SettingsMembersTab } from "./settings-members-tab";

const tabs = [
  { id: "general", label: "Préférences" },
  { id: "account", label: "Mon compte" },
  { id: "members", label: "Membres" },
  { id: "import", label: "Importer" },
];
export function SettingsDialog({
  open,
  workspaceId,
  workspaceName,
  user,
  isOwner,
  canEdit,
  onNavigate,
  onRefresh,
  onClose,
}: {
  open: boolean;
  workspaceId: string;
  workspaceName?: string;
  user: Bootstrap["user"];
  isOwner: boolean;
  canEdit: boolean;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const cache = useQueryClient();
  const [settingsTab, setSettingsTab] = useState("general");
  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => orpcClient.workspaces.members({ workspaceId }),
    enabled: open,
  });
  return (
    <Dialog
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent className="max-h-[85svh] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paramètres de l’espace</DialogTitle>
          <DialogDescription>{workspaceName}</DialogDescription>
        </DialogHeader>
        <nav className="settings-tabs">
          {tabs.map((tab) => (
            <button
              className={settingsTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {settingsTab === "general" && <SettingsGeneralTab user={user} />}
        {settingsTab === "account" && (
          <SettingsAccountTab
            name={user.name}
            onUpdated={async () => {
              await cache.invalidateQueries({
                queryKey: bootstrapQuery().queryKey,
              });
            }}
          />
        )}
        {settingsTab === "members" && (
          <SettingsMembersTab
            isOwner={isOwner}
            members={members.data ?? []}
            onChanged={async () => {
              await members.refetch();
            }}
            workspaceId={workspaceId}
          />
        )}
        {settingsTab === "import" && canEdit && (
          <SettingsImportTab
            onDone={async (id) => {
              await onRefresh();
              onNavigate(id);
              onClose();
            }}
            workspaceId={workspaceId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
