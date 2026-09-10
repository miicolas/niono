import { editorControls } from "@/features/editor/editor-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OpenAILogo } from "@/components/openai-logo";
import { QuestionnaireSection } from "../questionnaire-section";
import { Checkbox } from "@/components/ui/checkbox";
import { EditorAssistantDialog } from "../editor-assistant-dialog";
import { Textarea } from "@/components/ui/textarea";
import { searchMentions } from "@/features/editor/search-mentions";
import { Suspense, useCallback } from "react";
import { Clock3, ImagePlus, ChevronDown, LockKeyhole } from "lucide-react";
import { client } from "@/lib/api";
import { uploadFile } from "@/features/editor/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand-logo";
import { DatabaseSkeleton, DocumentSkeleton } from "@/components/loading-state";
import { reportError } from "@/lib/notifications";
import { type PageState, DatabaseView, DocumentEditor } from "./shared";

export function PageDocument({
  metadata,
  page,
  save,
  editorRef,
  canEdit,
  codexApplying,
  setPanel,
  title,
  setTitle,
  update,
  props,
  document,
  codex,
  data,
  setHeadings,
}: Pick<
  PageState,
  | "metadata"
  | "page"
  | "save"
  | "editorRef"
  | "canEdit"
  | "codexApplying"
  | "setPanel"
  | "title"
  | "setTitle"
  | "update"
  | "props"
  | "document"
  | "codex"
  | "data"
  | "setHeadings"
>) {
  const onMentionSearch = useCallback(
    (query: string, pagesOnly: boolean) =>
      searchMentions(props.workspaceId, query, pagesOnly),
    [props.workspaceId],
  );
  return (
    <article
      className={`document-content ${metadata.cover ? "has-cover" : ""} ${page.kind === "database" ? "database-document" : ""}`}
    >
      {save.draftError && (
        <div className="conflict-banner">
          Le stockage local est indisponible. Téléchargez votre brouillon avant
          de quitter la page si la sauvegarde échoue.
        </div>
      )}
      {save.draft && (
        <div className="conflict-banner">
          Un brouillon non enregistré a été retrouvé sur cet appareil.
          <div className="actions">
            <Button
              size="sm"
              onClick={() => {
                const content = save.recover();
                if (content) editorRef.current?.commands.setContent(content);
              }}
            >
              Récupérer le brouillon
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void save.ignoreRecovered()}
            >
              Ignorer
            </Button>
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="document-icon"
        disabled={!canEdit || codexApplying || !save.writable}
        aria-label="Changer l’icône"
        onClick={() => setPanel("icon")}
      >
        {metadata.icon}
      </Button>
      {canEdit && (
        <div className="document-properties">
          {!metadata.cover && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setPanel("cover")}
            >
              <ImagePlus size={13} />
              Ajouter une couverture
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setPanel("history")}
          >
            <Clock3 size={12} />
            Historique
          </Button>
        </div>
      )}
      <Textarea
        className="page-title"
        aria-label="Titre de la page"
        placeholder="Sans titre"
        rows={1}
        maxLength={300}
        value={title}
        disabled={!canEdit || codexApplying || !save.writable}
        ref={(node) => {
          if (node) {
            node.style.height = "auto";
            node.style.height = `${node.scrollHeight}px`;
          }
        }}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
        onBlur={() => {
          void save.flush();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
            editorRef.current?.commands.focus("start");
          }
        }}
      />
      <div className="document-meta">
        <Avatar className="avatar">
          <AvatarFallback>{props.user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span>
          {metadata.privateRoot ? (
            <>
              <LockKeyhole size={11} className="inline" /> Page privée
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
        <Suspense fallback={<DatabaseSkeleton />}>
          <DatabaseView
            pageId={page.id}
            workspaceId={props.workspaceId}
            editable={canEdit}
            onNavigate={props.onNavigate}
            onRefresh={props.onRefresh}
          />
        </Suspense>
      )}
      <Suspense fallback={<DocumentSkeleton bodyOnly />}>
        {save.ready && save.provider ? (
          <DocumentEditor
            collaboration={save.provider}
            ui={editorControls}
            AssistantDialog={EditorAssistantDialog}
            Checkbox={Checkbox}
            QuestionnaireSection={QuestionnaireSection}
            Input={Input}
            content={document.content}
            editable={canEdit && !codexApplying && save.writable}
            onChange={save.change}
            onReady={(editor) => {
              editorRef.current = editor;
            }}
            onMentionSearch={onMentionSearch}
            onUpload={(file, signal) => uploadFile(page.id, file, signal)}
            codexIcon={<OpenAILogo width={18} height={18} />}
            onCodex={(selection) => {
              void codex
                .askSelection({ ...selection, pageId: page.id })
                .catch(reportError);
            }}
            onAI={async (text, instruction) =>
              (await client.ai({ pageId: page.id, text, instruction })).text
            }
            aiAvailable={data.aiAvailable}
            onError={(message) => reportError(new Error(message))}
            onHeadings={setHeadings}
          />
        ) : (
          <DocumentSkeleton bodyOnly />
        )}
      </Suspense>
      {props.pages.filter((p) => p.parentId === page.id).length > 0 &&
        page.kind !== "database" && (
          <div className="child-pages">
            {props.pages
              .filter((p) => p.parentId === page.id)
              .map((p) => (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  key={p.id}
                  className="list-row w-full"
                  onClick={() => props.onNavigate(p.id)}
                >
                  {p.icon}
                  <span className="row-title text-left">{p.title}</span>
                  <ChevronDown size={12} className="-rotate-90" />
                </Button>
              ))}
          </div>
        )}
      <footer className="document-footer">
        <span className="document-footer-brand">
          <BrandLogo className="small" decorative />
          DigiPM · De la place pour vos idées
        </span>
        <span>{canEdit ? "Modifiable" : "Lecture seule"}</span>
      </footer>
    </article>
  );
}
