import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  lazy,
  type MutableRefObject,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

const DocumentEditor = lazy(() =>
  import("@/components/editor/document-editor").then((m) => ({
    default: m.DocumentEditor,
  }))
);

import type { Editor } from "@tiptap/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileDown,
  ImagePlus,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/features/editor/upload";
import { useDocumentSave } from "@/features/editor/use-document-save";
import { download } from "@/lib/ui/download";
import { reportError } from "@/lib/ui/notifications";
import { client } from "@/orpc/client";
import { documentText } from "@/validators/contracts";
import type { Bootstrap, PageItem } from "./types";

const DatabaseView = lazy(() =>
  import("@/features/database/database-view").then((m) => ({
    default: m.DatabaseView,
  }))
);

import { exportMarkdown } from "./export-markdown";

type Props = {
  pageId: string;
  workspaceId: string;
  user: Bootstrap["user"];
  pages: PageItem[];
  onRefresh: () => Promise<void>;
  onNavigate: (id: string) => void;
  beforeLeave: MutableRefObject<
    null | ((requireSaved?: boolean) => Promise<boolean>)
  >;
  onAction: (action: string) => void;
};
export function PageView(props: Props) {
  const query = useQuery({
    queryKey: ["page", props.pageId],
    queryFn: () => client.pages.get({ id: props.pageId }),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const [epoch, setEpoch] = useState(0);
  if (query.isPending) {
    return <div className="empty-state">Ouverture de la page…</div>;
  }
  if (!query.data) {
    return (
      <div className="empty-state">
        <h2>Cette page est indisponible</h2>
        <p>
          Elle a peut-être été déplacée dans la corbeille, ou vos accès ont
          changé.
        </p>
        <Button onClick={() => void query.refetch()}>Réessayer</Button>
      </div>
    );
  }
  return (
    <LoadedPage
      key={`${props.pageId}:${epoch}`}
      {...props}
      data={query.data}
      onReload={async () => {
        await query.refetch();
        setEpoch((i) => i + 1);
      }}
    />
  );
}
function LoadedPage({
  data,
  onReload,
  ...props
}: Props & {
  data: Awaited<ReturnType<typeof client.pages.get>>;
  onReload: () => Promise<void>;
}) {
  const { page, document, canEdit } = data;
  const [metadata, setMetadata] = useState(page);
  const [title, setTitle] = useState(page.title);
  const [panel, setPanel] = useState<
    "none" | "history" | "share" | "icon" | "cover"
  >("none");
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [icon, setIcon] = useState(page.icon);
  const [leaveResolve, setLeaveResolve] = useState<
    ((value: boolean) => void) | null
  >(null);
  const save = useDocumentSave(
    props.user.id,
    props.workspaceId,
    page.id,
    document.revision
  );
  const versions = useQuery({
    queryKey: ["versions", page.id],
    queryFn: () => client.pages.versions({ id: page.id }),
    enabled: panel === "history",
  });
  const members = useQuery({
    queryKey: ["members", props.workspaceId],
    queryFn: () => client.workspace.members({ workspaceId: props.workspaceId }),
    enabled: panel === "share",
  });
  const cache = useQueryClient();
  const metadataRef = useRef(metadata);
  useEffect(() => {
    if (page.revision <= metadataRef.current.revision) {
      return;
    }
    const previous = metadataRef.current;
    metadataRef.current = page;
    setMetadata(page);
    setTitle((value) => (value === previous.title ? page.title : value));
    setIcon(page.icon);
  }, [page]);
  const metadataQueue = useRef(Promise.resolve(true));
  const update = (
    changes: Partial<
      Pick<typeof page, "title" | "icon" | "cover" | "coverPosition">
    >
  ) => {
    metadataQueue.current = metadataQueue.current.then(async () => {
      try {
        if (
          Object.entries(changes).every(
            ([key, value]) =>
              metadataRef.current[key as keyof typeof metadata] === value
          )
        ) {
          return true;
        }
        const result = await client.pages.update({
          id: page.id,
          expectedRevision: metadataRef.current.revision,
          ...changes,
        });
        metadataRef.current = result;
        setMetadata(result);
        await props.onRefresh();
        return true;
      } catch (e) {
        reportError(e);
        await cache.invalidateQueries({ queryKey: ["page", page.id] });
        return false;
      }
    });
    return metadataQueue.current;
  };
  /** Flushes pending edits; throws `message` if the document still cannot be saved. */
  const ensureSaved = async (message: string) => {
    await save.flush();
    if (save.dirty()) {
      throw new Error(message);
    }
  };
  useEffect(() => {
    props.beforeLeave.current = async (requireSaved) => {
      if (
        title !== metadata.title &&
        !(await update({ title: title.trim() || "Sans titre" }))
      ) {
        return false;
      }
      if (requireSaved) {
        try {
          await ensureSaved(
            "Enregistrez ou résolvez le conflit avant de dupliquer cette page."
          );
          return true;
        } catch (error) {
          reportError(error);
          return false;
        }
      }
      await save.flush();
      if (!save.dirty()) {
        return true;
      }
      return new Promise<boolean>((resolve) => setLeaveResolve(() => resolve));
    };
    return () => {
      props.beforeLeave.current = null;
    };
  });
  const downloadDraft = () => {
    download(
      `${title || "page"}-brouillon.json`,
      JSON.stringify(
        save.latest() ?? editorRef.current?.getJSON() ?? document.content,
        null,
        2
      ),
      "application/json"
    );
  };
  return (
    <>
      <div className="page-toolbar">
        <span
          className={`save-status ${save.status === "conflict" || save.status === "error" ? "error" : ""}`}
          role="status"
        >
          {save.status === "saving" ? (
            <Loader2 className="animate-spin" size={12} />
          ) : save.status === "saved" ? (
            <Check size={12} />
          ) : null}
          {
            {
              saved: "Enregistré",
              dirty: "Modifications…",
              saving: "Enregistrement…",
              error: "Hors ligne · brouillon local",
              conflict: "Conflit à résoudre",
            }[save.status]
          }
        </span>
        <button
          aria-label="Favoris"
          className="icon-button"
          onClick={() => props.onAction("favorite")}
        >
          <Star
            fill={
              props.pages.find((p) => p.id === page.id)?.favorite
                ? "currentColor"
                : "none"
            }
            size={15}
          />
        </button>
        <button className="subtle-button" onClick={() => setPanel("share")}>
          <Share2 size={13} />
          Partager
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Actions de la page" className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await ensureSaved(
                    "Enregistrez ou résolvez le conflit avant d’exporter l’archive."
                  );
                  const archive = await client.transfer.export({
                    pageId: page.id,
                    includeAssets: true,
                  });
                  download(
                    `${title}-archive.json`,
                    JSON.stringify(archive, null, 2),
                    "application/json"
                  );
                } catch (error) {
                  reportError(error);
                }
              }}
            >
              <FileDown />
              Exporter la page et ses sous-pages
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setPanel("history")}>
              <Clock3 />
              Historique des versions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void exportMarkdown(
                  title,
                  editorRef.current?.getHTML() ?? ""
                ).catch(reportError);
              }}
            >
              <FileDown />
              Exporter en Markdown
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                download(
                  `${title}.json`,
                  JSON.stringify(
                    {
                      format: "digipm-page",
                      version: 1,
                      title,
                      icon: metadata.icon,
                      content: editorRef.current?.getJSON() ?? document.content,
                    },
                    null,
                    2
                  ),
                  "application/json"
                )
              }
            >
              <FileDown />
              Exporter en JSON
            </DropdownMenuItem>
            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => props.onAction("duplicate")}>
                  <Copy />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => props.onAction("move")}>
                  <ArrowUpRight />
                  Déplacer vers…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => props.onAction("trash")}
                  variant="destructive"
                >
                  <Trash2 />
                  Mettre à la corbeille
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {metadata.cover && (
        <div className="document-cover">
          <img
            alt="Couverture de la page"
            src={metadata.cover}
            style={{ objectPosition: `50% ${metadata.coverPosition}%` }}
          />
          {canEdit && (
            <div className="cover-actions">
              <button onClick={() => setPanel("cover")}>
                Changer la couverture
              </button>
              <button onClick={() => void update({ cover: null })}>
                Retirer
              </button>
            </div>
          )}
        </div>
      )}
      <article
        className={`document-content ${metadata.cover ? "has-cover" : ""} ${page.kind === "database" ? "database-document" : ""}`}
      >
        {save.draftError && (
          <div className="conflict-banner">
            Le stockage local est indisponible. Téléchargez votre brouillon
            avant de quitter la page si la sauvegarde échoue.
          </div>
        )}
        {save.draft && (
          <div className="conflict-banner">
            Un brouillon non enregistré a été retrouvé sur cet appareil.
            <div className="actions">
              <Button
                onClick={() => {
                  const content = save.recover();
                  if (content) {
                    editorRef.current?.commands.setContent(content);
                  }
                }}
                size="sm"
              >
                Récupérer le brouillon
              </Button>
              <Button
                onClick={() => void save.ignoreRecovered()}
                size="sm"
                variant="outline"
              >
                Ignorer
              </Button>
            </div>
          </div>
        )}
        {(save.status === "conflict" || save.status === "error") && (
          <div className="conflict-banner">
            {save.status === "conflict"
              ? "Une autre version de cette page a été enregistrée. Votre texte est conservé sur cet appareil."
              : "La sauvegarde n’a pas abouti. Votre brouillon est conservé sur cet appareil."}
            <div className="actions">
              <Button onClick={downloadDraft} size="sm" variant="outline">
                Télécharger mon brouillon
              </Button>
              {canEdit && (
                <Button
                  onClick={async () => {
                    try {
                      const copy = await client.pages.create({
                        workspaceId: props.workspaceId,
                        parentId: page.id,
                        title: `${title} — copie`,
                        icon: metadata.icon,
                        content: save.latest() ?? document.content,
                      });
                      await save.discard();
                      await props.onRefresh();
                      props.onNavigate(copy.id);
                    } catch (error) {
                      reportError(error);
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  Créer une sous-page de secours
                </Button>
              )}
              {save.status === "error" ? (
                <Button onClick={() => void save.flush()} size="sm">
                  Réessayer
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    downloadDraft();
                    await save.discard();
                    await onReload();
                  }}
                  size="sm"
                >
                  Recharger la version du serveur
                </Button>
              )}
            </div>
          </div>
        )}
        <button
          aria-label="Changer l’icône"
          className="document-icon"
          disabled={!canEdit}
          onClick={() => setPanel("icon")}
        >
          {metadata.icon}
        </button>
        {canEdit && (
          <div className="document-properties">
            {!metadata.cover && (
              <button onClick={() => setPanel("cover")}>
                <ImagePlus size={13} />
                Ajouter une couverture
              </button>
            )}
            <button onClick={() => setPanel("history")}>
              <Clock3 size={12} />
              Historique
            </button>
          </div>
        )}
        <textarea
          aria-label="Titre de la page"
          className="page-title"
          disabled={!canEdit}
          maxLength={300}
          onBlur={() => {
            if (title !== metadata.title) {
              void update({ title: title.trim() || "Sans titre" });
            }
          }}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
              editorRef.current?.commands.focus("start");
            }
          }}
          placeholder="Sans titre"
          ref={(node) => {
            if (node) {
              node.style.height = "auto";
              node.style.height = `${node.scrollHeight}px`;
            }
          }}
          rows={1}
          value={title}
        />
        <div className="document-meta">
          <span className="avatar">{props.user.name.slice(0, 1)}</span>
          <span>
            {metadata.privateRoot ? (
              <>
                <LockKeyhole className="inline" size={11} /> Page privée
              </>
            ) : (
              "Espace de travail"
            )}
          </span>
          <span className="dot">·</span>
          <span>
            {new Date(metadata.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}
          </span>
          {!canEdit && <span>· Lecture seule</span>}
        </div>
        {page.kind === "database" && (
          <Suspense fallback={<p className="muted">Ouverture de la base…</p>}>
            <DatabaseView
              editable={canEdit}
              onNavigate={props.onNavigate}
              onRefresh={props.onRefresh}
              pageId={page.id}
              workspaceId={props.workspaceId}
            />
          </Suspense>
        )}
        <Suspense
          fallback={<p className="editor-loading">Ouverture de votre page…</p>}
        >
          <DocumentEditor
            aiAvailable={data.aiAvailable}
            content={document.content}
            editable={canEdit}
            onAI={async (text, instruction) =>
              (await client.ai({ pageId: page.id, text, instruction })).text
            }
            onChange={save.change}
            onError={(message) => reportError(new Error(message))}
            onHeadings={setHeadings}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            onUpload={(file) => uploadFile(page.id, file)}
          />
        </Suspense>
        {props.pages.filter((p) => p.parentId === page.id).length > 0 &&
          page.kind !== "database" && (
            <div className="child-pages">
              {props.pages
                .filter((p) => p.parentId === page.id)
                .map((p) => (
                  <button
                    className="w-full list-row"
                    key={p.id}
                    onClick={() => props.onNavigate(p.id)}
                  >
                    {p.icon}
                    <span className="row-title text-left">{p.title}</span>
                    <ChevronDown className="-rotate-90" size={12} />
                  </button>
                ))}
            </div>
          )}
        <footer className="document-footer">
          <span>DigiPM · De la place pour vos idées</span>
          <span>{canEdit ? "Modifiable" : "Lecture seule"}</span>
        </footer>
      </article>
      {headings.length > 1 && (
        <nav aria-label="Sommaire" className="document-toc">
          {headings.map((h, i) => (
            <a
              aria-label={h.text}
              href={`#${h.id}`}
              key={h.id ?? i}
              onClick={(e) => {
                e.preventDefault();
                window.document
                  .querySelector(`[data-id="${CSS.escape(h.id)}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              style={{ width: h.level === 1 ? 20 : 14 }}
              title={h.text}
            />
          ))}
        </nav>
      )}
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "icon"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Une icône pour votre page</DialogTitle>
            <DialogDescription>
              Choisissez un symbole, ou écrivez le vôtre.
            </DialogDescription>
          </DialogHeader>
          <div className="emoji-grid">
            {"📄 📝 ✳️ 💡 📚 🌿 🪴 🎯 🚀 🗓️ 💬 🧭 🏡 💼 🎨 🧪 ☕ 📌 🔖 🌙 ⚡ 🏗️ 📊 🔮"
              .split(" ")
              .map((emoji) => (
                <button
                  key={emoji}
                  onClick={async () => {
                    if (await update({ icon: emoji })) {
                      setPanel("none");
                    }
                  }}
                >
                  {emoji}
                </button>
              ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await update({ icon })) {
                setPanel("none");
              }
            }}
          >
            <Input
              aria-label="Icône personnalisée"
              maxLength={50}
              onChange={(e) => setIcon(e.target.value)}
              value={icon}
            />
            <Button>Utiliser</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "cover"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Habillez votre page</DialogTitle>
            <DialogDescription>
              Importez une image PNG, JPEG, GIF ou WebP.
            </DialogDescription>
          </DialogHeader>
          <input
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }
              try {
                const asset = await uploadFile(page.id, file);
                if (!asset.mime.startsWith("image/")) {
                  throw new Error(
                    "Ce fichier n’est pas une image prise en charge."
                  );
                }
                if (await update({ cover: asset.url })) {
                  setPanel("none");
                }
              } catch (error) {
                reportError(error);
              }
            }}
            ref={fileInput}
            type="file"
          />
          {metadata.cover && (
            <label className="grid gap-3">
              Position de la couverture
              <input
                aria-label="Position de la couverture"
                defaultValue={metadata.coverPosition}
                max={100}
                min={0}
                onKeyUp={(e) =>
                  void update({ coverPosition: Number(e.currentTarget.value) })
                }
                onPointerUp={(e) =>
                  void update({ coverPosition: Number(e.currentTarget.value) })
                }
                type="range"
              />
            </label>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "history"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historique des versions</DialogTitle>
            <DialogDescription>
              Un instantané est conservé avant la première modification, puis au
              plus toutes les cinq minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-auto">
            {versions.data?.map((v) => (
              <button
                className="w-full list-row"
                key={v.id}
                onClick={() => setSelectedVersion(v.id)}
              >
                <Clock3 size={14} />
                <span>
                  Version {v.revision} ·{" "}
                  {new Date(v.createdAt).toLocaleString("fr-FR")}
                </span>
              </button>
            ))}
            {!versions.data?.length && (
              <p className="muted">
                Les versions apparaîtront après vos premières modifications.
              </p>
            )}
          </div>
          {selectedVersion && (
            <>
              <div className="version-preview">
                {documentText(
                  versions.data?.find((v) => v.id === selectedVersion)
                    ?.content ?? document.content
                )}
              </div>
              {canEdit && (
                <Button
                  onClick={async () => {
                    try {
                      await ensureSaved(
                        "Résolvez la sauvegarde en cours avant de restaurer."
                      );
                      await client.pages.restore({
                        id: page.id,
                        versionId: selectedVersion,
                        expectedRevision: save.revision(),
                      });
                      await onReload();
                      await cache.invalidateQueries({
                        queryKey: ["versions", page.id],
                      });
                    } catch (e) {
                      reportError(e);
                    }
                  }}
                >
                  Restaurer cette version
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            setPanel("none");
          }
        }}
        open={panel === "share"}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager cette page</DialogTitle>
            <DialogDescription>
              {metadata.privateRoot
                ? "Cette page est restreinte."
                : "Les membres autorisés de l’espace ont accès à cette page."}{" "}
              Les accès de ses pages parentes s’appliquent également.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              void navigator.clipboard
                .writeText(window.location.href)
                .then(() =>
                  import("sonner").then(({ toast }) =>
                    toast.success("Lien copié")
                  )
                )
                .catch(reportError);
            }}
            variant="outline"
          >
            Copier le lien
          </Button>
          {metadata.createdBy === props.user.id && (
            <ShareForm
              grants={data.grants}
              isPrivate={metadata.privateRoot}
              members={members.data ?? []}
              onDone={async () => {
                setPanel("none");
                const fresh = await client.pages.get({ id: page.id });
                metadataRef.current = fresh.page;
                setMetadata(fresh.page);
                cache.setQueryData(["page", page.id], fresh);
                await props.onRefresh();
              }}
              pageId={page.id}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        onOpenChange={(v) => {
          if (!v) {
            leaveResolve?.(false);
            setLeaveResolve(null);
          }
        }}
        open={!!leaveResolve}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Votre brouillon n’est pas encore enregistré
            </DialogTitle>
            <DialogDescription>
              Vous pouvez rester pour réessayer, ou changer de page en
              conservant le brouillon sur cet appareil.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              leaveResolve?.(false);
              setLeaveResolve(null);
            }}
          >
            Rester sur cette page
          </Button>
          <Button
            onClick={() => {
              leaveResolve?.(true);
              setLeaveResolve(null);
            }}
            variant="outline"
          >
            Continuer avec le brouillon local
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
function ShareForm({
  pageId,
  isPrivate,
  members,
  grants,
  onDone,
}: {
  pageId: string;
  isPrivate: boolean;
  grants: { userId: string; role: "editor" | "viewer" }[];
  members: Awaited<ReturnType<typeof client.workspace.members>>;
  onDone: () => Promise<void>;
}) {
  const [privateRoot, setPrivateRoot] = useState(isPrivate);
  return (
    <form
      className="panel-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const grants = members.flatMap<{
          userId: string;
          role: "editor" | "viewer";
        }>((member) => {
          const value = form.get(member.id);
          return value === "editor" || value === "viewer"
            ? [{ userId: member.id, role: value }]
            : [];
        });
        try {
          await client.pages.share({ pageId, privateRoot, grants });
          await onDone();
        } catch (error) {
          reportError(error);
        }
      }}
    >
      <label>
        <select
          aria-label="Accès à la page"
          onChange={(e) => setPrivateRoot(e.target.value === "private")}
          value={privateRoot ? "private" : "workspace"}
        >
          <option value="workspace">Membres de l’espace</option>
          <option value="private">Page privée</option>
        </select>
      </label>
      {privateRoot && (
        <>
          <p className="muted text-xs">
            Définissez les accès à enregistrer. Le créateur conserve ses droits.
          </p>
          {members.map((member) => (
            <label className="settings-row" key={member.id}>
              <span>{member.name}</span>
              <select
                aria-label={`Accès de ${member.name}`}
                defaultValue={
                  grants.find((g) => g.userId === member.id)?.role ?? "none"
                }
                name={member.id}
              >
                <option value="none">Aucun</option>
                <option value="viewer">Lecture</option>
                <option value="editor">Modification</option>
              </select>
            </label>
          ))}
        </>
      )}
      <Button>Enregistrer les accès</Button>
    </form>
  );
}
