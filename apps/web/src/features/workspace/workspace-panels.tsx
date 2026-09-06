import { AccountSettings } from "@/features/auth/account-settings";
import { ImportPanel } from "./import-panel";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, RotateCcw, Plus, FileUp, Mail } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useUI } from "@/lib/ui-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Bootstrap } from "./types";
import { reportError } from "@/lib/notifications";
import { parseImportedPage } from "./transfer";
import type { DocumentNode } from "@digipm/contracts";
export function WorkspacePanels({
  workspaceId,
  bootstrap,
  onNavigate,
  onRefresh,
}: {
  workspaceId: string;
  bootstrap: Bootstrap;
  onNavigate: (id: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const panel = useUI((s) => s.panel);
  const setPanel = useUI((s) => s.setPanel);
  const theme = useUI((s) => s.theme);
  const setTheme = useUI((s) => s.setTheme);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [settingsTab, setSettingsTab] = useState("general");
  const [busy, setBusy] = useState(false);
  const cache = useQueryClient();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(timer);
  }, [query]);
  const results = useQuery({
    queryKey: ["search", workspaceId, debounced],
    queryFn: () => client.pages.search({ workspaceId, query: debounced }),
    enabled: panel === "search",
  });
  const trash = useQuery({
    queryKey: ["trash", workspaceId],
    queryFn: () => client.pages.list({ workspaceId, trash: true }),
    enabled: panel === "trash",
  });
  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => client.workspace.members({ workspaceId }),
    enabled: panel === "settings",
  });
  const isOwner =
    bootstrap.workspaces.find((w) => w.id === workspaceId)?.role === "owner";
  const canEdit =
    bootstrap.workspaces.find((w) => w.id === workspaceId)?.role !== "viewer";
  const close = () => setPanel("none");
  const templates = [
    {
      icon: "🗓️",
      title: "Notes de réunion",
      description: "Un ordre du jour, des décisions et une suite claire.",
      sections: [
        "Ordre du jour",
        "Notes & discussions",
        "Décisions",
        "Prochaines étapes",
      ],
    },
    {
      icon: "🚀",
      title: "Brief de projet",
      description: "Une direction commune pour votre prochain projet.",
      sections: ["Contexte", "Objectifs", "Livrables", "Étapes & calendrier"],
    },
    {
      icon: "🌿",
      title: "Journal personnel",
      description: "Prenez le temps de poser vos idées.",
      sections: ["Aujourd’hui", "Ce que j’ai appris", "Une idée pour demain"],
    },
    {
      icon: "📚",
      title: "Wiki d’équipe",
      description: "Tout ce que votre équipe a besoin de retrouver.",
      sections: ["Bienvenue", "Notre façon de travailler", "Ressources utiles"],
    },
  ];
  return (
    <>
      <Dialog
        open={panel === "search"}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Rechercher dans l’espace</DialogTitle>
            <DialogDescription>
              Retrouvez vos pages par leur titre ou leur contenu.
            </DialogDescription>
          </DialogHeader>
          <input
            className="search-input"
            autoFocus
            aria-label="Rechercher dans l’espace"
            placeholder="Rechercher dans votre espace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="p-2 max-h-96 overflow-auto">
            {results.isFetching && (
              <p className="muted p-3 text-xs">Recherche…</p>
            )}
            {results.error && (
              <p role="alert" className="p-3">
                {results.error.message}
              </p>
            )}
            {results.data?.map((page) => (
              <button
                className="search-result hover:bg-accent"
                key={page.id}
                onClick={() => {
                  onNavigate(page.id);
                  close();
                }}
              >
                {page.icon}{" "}
                <strong className="font-medium">{page.title}</strong>
                <small>{page.excerpt}</small>
              </button>
            ))}
            {!results.isFetching && !results.data?.length && (
              <div className="empty-state p-8">
                <Search size={24} />
                <p>Aucune page trouvée.</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t text-xs muted">
            Recherchez par mots, dans les pages auxquelles vous avez accès.
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel === "trash"}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corbeille</DialogTitle>
            <DialogDescription>
              Restaurez une page pour retrouver son contenu et ses sous-pages.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            {trash.data
              ?.filter((p) => p.deletedAt)
              .map((page) => (
                <div className="list-row" key={page.id}>
                  <span>{page.icon}</span>
                  <span className="row-title">{page.title}</span>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await client.pages.trash({
                            id: page.id,
                            restore: true,
                          });
                          await trash.refetch();
                          await onRefresh();
                          toast.success("Page restaurée");
                        } catch (e) {
                          reportError(e);
                        }
                      }}
                    >
                      <RotateCcw size={13} />
                      Restaurer
                    </Button>
                  )}
                </div>
              ))}
            {!trash.data?.length && (
              <div className="empty-state p-8">
                <Trash2 size={25} />
                <p>Votre corbeille est vide.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel === "templates"}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Une longueur d’avance</DialogTitle>
            <DialogDescription>
              Choisissez un point de départ et appropriez-vous la page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <button
                disabled={!canEdit || busy}
                key={template.title}
                className="recent-card"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const content: DocumentNode = {
                      type: "doc",
                      content: template.sections.flatMap((title) => [
                        {
                          type: "heading",
                          attrs: { level: 2 },
                          content: [{ type: "text", text: title }],
                        },
                        { type: "paragraph" },
                      ]),
                    };
                    const page = await client.pages.create({
                      workspaceId,
                      title: template.title,
                      icon: template.icon,
                      content,
                    });
                    await onRefresh();
                    onNavigate(page.id);
                    close();
                  } catch (e) {
                    reportError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span className="card-icon">{template.icon}</span>
                <strong>{template.title}</strong>
                <small>{template.description}</small>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={panel === "settings"}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85svh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Paramètres de l’espace</DialogTitle>
            <DialogDescription>
              {bootstrap.workspaces.find((w) => w.id === workspaceId)?.name}
            </DialogDescription>
          </DialogHeader>
          <nav className="settings-tabs">
            {[
              { id: "general", label: "Préférences" },
              { id: "account", label: "Mon compte" },
              { id: "members", label: "Membres" },
              { id: "import", label: "Importer" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={settingsTab === tab.id ? "active" : ""}
                onClick={() => setSettingsTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {settingsTab === "general" && (
            <>
              <div className="settings-row">
                <div>
                  Apparence<p>Un fond sombre ou une page de papier.</p>
                </div>
                <select
                  aria-label="Apparence"
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value === "dark" ? "dark" : "light")
                  }
                >
                  <option value="dark">Sombre</option>
                  <option value="light">Papier</option>
                </select>
              </div>
              <div className="settings-row">
                <div>
                  Votre compte<p>{bootstrap.user.email}</p>
                </div>
                {!bootstrap.user.emailVerified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const result = await authClient.sendVerificationEmail({
                          email: bootstrap.user.email,
                          callbackURL: "/",
                        });
                        if (result.error) throw new Error(result.error.message);
                        toast.success("Email de vérification envoyé");
                      } catch (e) {
                        reportError(e);
                      }
                    }}
                  >
                    Vérifier mon email
                  </Button>
                )}
              </div>
              <p className="muted text-xs">
                Les contenus sont enregistrés automatiquement. En cas de
                coupure, votre brouillon reste sur cet appareil.
              </p>
            </>
          )}
          {settingsTab === "account" && (
            <AccountSettings
              name={bootstrap.user.name}
              onUpdated={async () => {
                await cache.invalidateQueries({ queryKey: ["bootstrap"] });
              }}
            />
          )}
          {settingsTab === "members" && (
            <>
              <div>
                {members.data?.map((member) => (
                  <div className="settings-row" key={member.id}>
                    <span>
                      <strong className="font-medium">{member.name}</strong>
                      <p>{member.email}</p>
                    </span>
                    {isOwner && member.role !== "owner" ? (
                      <select
                        aria-label={`Rôle de ${member.name}`}
                        value={member.role}
                        onChange={async (e) => {
                          try {
                            await client.workspace.role({
                              workspaceId,
                              memberId: member.id,
                              role: e.target.value as
                                "editor" | "viewer" | "remove",
                            });
                            await members.refetch();
                          } catch (error) {
                            reportError(error);
                          }
                        }}
                      >
                        <option value="editor">Peut modifier</option>
                        <option value="viewer">Peut consulter</option>
                        <option value="remove">Retirer de l’espace</option>
                      </select>
                    ) : (
                      <span className="muted text-xs">
                        {member.role === "owner"
                          ? "Propriétaire"
                          : member.role === "editor"
                            ? "Éditeur"
                            : "Lecteur"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {isOwner && (
                <form
                  className="panel-form mt-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    setBusy(true);
                    try {
                      await client.workspace.invite({
                        workspaceId,
                        email: String(data.get("email")),
                        role:
                          data.get("role") === "viewer" ? "viewer" : "editor",
                      });
                      toast.success("Invitation envoyée");
                    } catch (error) {
                      reportError(error);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Inviter un membre
                    <Input
                      name="email"
                      type="email"
                      placeholder="personne@exemple.fr"
                      required
                    />
                  </label>
                  <select name="role" aria-label="Rôle de l’invité">
                    <option value="editor">Peut modifier</option>
                    <option value="viewer">Peut consulter</option>
                  </select>
                  <Button disabled={busy}>
                    <Mail size={14} />
                    Envoyer l’invitation
                  </Button>
                </form>
              )}
            </>
          )}
          {settingsTab === "import" && canEdit && (
            <ImportPanel
              workspaceId={workspaceId}
              onDone={async (id) => {
                await onRefresh();
                onNavigate(id);
                close();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
