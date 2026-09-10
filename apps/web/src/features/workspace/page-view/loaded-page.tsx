import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type LoadedPageProps } from "./shared";
import { usePage } from "./use-page";
import { PageSaveFailure } from "./page-save-failure";
import { PageToolbar } from "./page-toolbar";
import { PageDocument } from "./page-document";
import { PageIconDialog } from "./page-icon-dialog";
import { PageCoverDialog } from "./page-cover-dialog";
import { PageHistoryDialog } from "./page-history-dialog";
import { PageShareDialog } from "./page-share-dialog";

export function LoadedPage(initialProps: LoadedPageProps) {
  const {
    save,
    downloadDraft,
    canEdit,
    props,
    page,
    title,
    metadata,
    document,
    onReload,
    setPanel,
    editorRef,
    update,
    codexApplying,
    setTitle,
    codex,
    data,
    setHeadings,
    headings,
    panel,
    icon,
    fileInput,
    versions,
    setSelectedVersion,
    selectedVersion,
    cache,
    members,
    metadataRef,
    setMetadata,
    leaveResolve,
    setLeaveResolve,
  } = usePage(initialProps);
  if (save.revoked)
    return (
      <div role="alert" className="p-8">
        L’accès à cette page a été retiré. Votre brouillon reste conservé sur
        cet appareil.
      </div>
    );
  return (
    <>
      <PageSaveFailure
        save={save}
        downloadDraft={downloadDraft}
        canEdit={canEdit}
        props={props}
        page={page}
        title={title}
        metadata={metadata}
        document={document}
        onReload={onReload}
      />
      <PageToolbar
        save={save}
        props={props}
        page={page}
        setPanel={setPanel}
        title={title}
        editorRef={editorRef}
        metadata={metadata}
        document={document}
        canEdit={canEdit}
      />
      {metadata.cover && (
        <div className="document-cover">
          <img
            src={metadata.cover}
            style={{ objectPosition: `50% ${metadata.coverPosition}%` }}
            alt="Couverture de la page"
          />
          {canEdit && (
            <div className="cover-actions">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPanel("cover")}
              >
                Changer la couverture
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => void update({ cover: null })}
              >
                Retirer
              </Button>
            </div>
          )}
        </div>
      )}
      <PageDocument
        metadata={metadata}
        page={page}
        save={save}
        editorRef={editorRef}
        canEdit={canEdit}
        codexApplying={codexApplying}
        setPanel={setPanel}
        title={title}
        setTitle={setTitle}
        update={update}
        props={props}
        document={document}
        codex={codex}
        data={data}
        setHeadings={setHeadings}
      />
      {headings.length > 1 && (
        <nav className="document-toc" aria-label="Sommaire">
          {headings.map((h, i) => (
            <a
              key={h.id ?? i}
              href={`#${h.id}`}
              aria-label={h.text}
              title={h.text}
              style={{ width: h.level === 1 ? 20 : 14 }}
              onClick={(e) => {
                e.preventDefault();
                window.document
                  .querySelector(`[data-id="${CSS.escape(h.id)}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          ))}
        </nav>
      )}
      <PageIconDialog
        panel={panel}
        setPanel={setPanel}
        update={update}
        icon={icon}
      />
      <PageCoverDialog
        panel={panel}
        setPanel={setPanel}
        fileInput={fileInput}
        page={page}
        update={update}
        metadata={metadata}
      />
      <PageHistoryDialog
        panel={panel}
        setPanel={setPanel}
        versions={versions}
        setSelectedVersion={setSelectedVersion}
        selectedVersion={selectedVersion}
        document={document}
        canEdit={canEdit}
        save={save}
        page={page}
        onReload={onReload}
        cache={cache}
      />
      <PageShareDialog
        panel={panel}
        setPanel={setPanel}
        metadata={metadata}
        props={props}
        data={data}
        page={page}
        members={members}
        metadataRef={metadataRef}
        setMetadata={setMetadata}
        cache={cache}
      />
      <Dialog
        open={!!leaveResolve}
        onOpenChange={(v) => {
          if (!v) {
            leaveResolve?.(false);
            setLeaveResolve(null);
          }
        }}
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
            variant="outline"
            onClick={() => {
              leaveResolve?.(true);
              setLeaveResolve(null);
            }}
          >
            Continuer avec le brouillon local
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
