import { useQueryClient } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { uploadFile } from "@/lib/editor/upload-file";
import { download } from "@/lib/ui/download";
import { reportError } from "@/lib/ui/notifications";
import { orpcClient } from "@/orpc/client";
import { pageExportHandlers } from "@/routes/(application)/-lib/page-export-handlers";
import type {
  Heading,
  PageData,
  PagePanel,
} from "@/routes/(application)/-lib/types";
import { useDocumentSave } from "@/routes/(application)/-lib/use-document-save";
import { usePageMetadata } from "@/routes/(application)/-lib/use-page-metadata";
import { ChildPagesList } from "./child-pages-list";
import { CoverDialog } from "./cover-dialog";
import { DocumentToc } from "./document-toc";
import { IconPickerDialog } from "./icon-picker-dialog";
import { LeaveConfirmDialog } from "./leave-confirm-dialog";
import { PageCover } from "./page-cover";
import { PageHeader } from "./page-header";
import { PageSaveBanners } from "./page-save-banners";
import { PageToolbar } from "./page-toolbar";
import type { PageViewProps } from "./page-view";
import { ShareDialog } from "./share-dialog";
import { VersionHistoryDialog } from "./version-history-dialog";

const DocumentEditor = lazy(() =>
  import("@/components/editor/document-editor").then((m) => ({
    default: m.DocumentEditor,
  }))
);
const DatabaseView = lazy(() =>
  import("@/routes/(application)/-components/database/database-view").then(
    (m) => ({ default: m.DatabaseView })
  )
);

type Props = PageViewProps & {
  data: PageData;
  onReload: () => Promise<void>;
};

export function LoadedPage({ data, onReload, ...props }: Props) {
  const { page, document, canEdit } = data;
  const meta = usePageMetadata(page, props.onRefresh);
  const { metadata, title, setTitle, update } = meta;
  const [panel, setPanel] = useState<PagePanel>("none");
  const [headings, setHeadings] = useState<Heading[]>([]);
  const editorRef = useRef<Editor | null>(null);
  const [leaveResolve, setLeaveResolve] = useState<
    ((value: boolean) => void) | null
  >(null);
  const save = useDocumentSave(
    props.user.id,
    props.workspaceId,
    page.id,
    document.revision
  );
  const cache = useQueryClient();
  const closePanel = () => setPanel("none");
  /** Flushes pending edits; throws `message` if the document still cannot be saved. */
  const ensureSaved = async (message: string) => {
    await save.flush();
    if (save.dirty()) {
      throw new Error(message);
    }
  };
  const commitTitle = () => update({ title: title.trim() || "Sans titre" });
  useEffect(() => {
    props.beforeLeave.current = async (requireSaved) => {
      if (title !== metadata.title && !(await commitTitle())) {
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
  const createBackupPage = async () => {
    try {
      const copy = await orpcClient.pages.create({
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
  };
  const restoreVersion = async (versionId: string) => {
    try {
      await ensureSaved("Résolvez la sauvegarde en cours avant de restaurer.");
      await orpcClient.documents.restore({
        id: page.id,
        versionId,
        expectedRevision: save.revision(),
      });
      await onReload();
      await cache.invalidateQueries({ queryKey: ["versions", page.id] });
    } catch (e) {
      reportError(e);
    }
  };
  const exports = pageExportHandlers({
    pageId: page.id,
    title,
    icon: metadata.icon,
    content: document.content,
    editorRef,
    ensureSaved,
  });
  const refreshAfterShare = async () => {
    closePanel();
    const fresh = await orpcClient.pages.get({ id: page.id });
    meta.replace(fresh.page);
    cache.setQueryData(["page", page.id], fresh);
    await props.onRefresh();
  };
  const isDatabase = page.kind === "database";
  return (
    <>
      <PageToolbar
        favorite={!!props.pages.find((p) => p.id === page.id)?.favorite}
        menu={{
          ...exports,
          canEdit,
          onAction: props.onAction,
          onHistory: () => setPanel("history"),
        }}
        onFavorite={() => props.onAction("favorite")}
        onShare={() => setPanel("share")}
        status={save.status}
      />
      {metadata.cover && (
        <PageCover
          canEdit={canEdit}
          cover={metadata.cover}
          coverPosition={metadata.coverPosition}
          onChange={() => setPanel("cover")}
          onRemove={() => update({ cover: null })}
        />
      )}
      <article
        className={`document-content ${metadata.cover ? "has-cover" : ""} ${isDatabase ? "database-document" : ""}`}
      >
        <PageSaveBanners
          canEdit={canEdit}
          onApplyDraft={(content) =>
            editorRef.current?.commands.setContent(content)
          }
          onCreateBackup={() => createBackupPage()}
          onDownloadDraft={downloadDraft}
          onReload={async () => {
            downloadDraft();
            await save.discard();
            await onReload();
          }}
          save={save}
        />
        <PageHeader
          canEdit={canEdit}
          metadata={metadata}
          onOpenPanel={setPanel}
          onTitleChange={setTitle}
          onTitleCommit={() => {
            if (title !== metadata.title) {
              commitTitle();
            }
          }}
          onTitleEnter={() => editorRef.current?.commands.focus("start")}
          title={title}
          userName={props.user.name}
        />
        {isDatabase && (
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
              (
                await orpcClient.ai.rewrite({
                  pageId: page.id,
                  text,
                  instruction,
                })
              ).text
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
        {!isDatabase && (
          <ChildPagesList
            onNavigate={props.onNavigate}
            pages={props.pages}
            parentId={page.id}
          />
        )}
        <footer className="document-footer">
          <span>DigiPM · De la place pour vos idées</span>
          <span>{canEdit ? "Modifiable" : "Lecture seule"}</span>
        </footer>
      </article>
      <DocumentToc headings={headings} />
      <IconPickerDialog
        icon={meta.icon}
        onClose={closePanel}
        onIconChange={meta.setIcon}
        onSelect={(icon) => update({ icon })}
        open={panel === "icon"}
      />
      <CoverDialog
        cover={metadata.cover}
        coverPosition={metadata.coverPosition}
        onClose={closePanel}
        onUpdate={update}
        open={panel === "cover"}
        pageId={page.id}
      />
      <VersionHistoryDialog
        canEdit={canEdit}
        fallbackContent={document.content}
        onClose={closePanel}
        onRestore={restoreVersion}
        open={panel === "history"}
        pageId={page.id}
      />
      <ShareDialog
        createdBy={metadata.createdBy}
        grants={data.grants}
        onClose={closePanel}
        onDone={refreshAfterShare}
        open={panel === "share"}
        pageId={page.id}
        privateRoot={metadata.privateRoot}
        userId={props.user.id}
        workspaceId={props.workspaceId}
      />
      <LeaveConfirmDialog
        onDecide={(leave) => {
          leaveResolve?.(leave);
          setLeaveResolve(null);
        }}
        open={!!leaveResolve}
      />
    </>
  );
}
