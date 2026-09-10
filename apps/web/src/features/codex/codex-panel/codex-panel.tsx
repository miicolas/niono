import { ContextToolbar } from "../pm-os/context-toolbar";
import { OpenAILogo } from "@/components/openai-logo";
import { ArrowDown, ArrowLeft, Settings2, LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/api";
import { CodexSettings } from "../codex-settings";
import { type CodexPanelProps } from "./codex-panel-props";
import { useCodexPanel } from "./use-codex-panel";
import { CodexHistory } from "./codex-history";
import { CodexMessages } from "./codex-messages";
import { CodexComposer } from "./codex-composer";

export function CodexPanel(props: CodexPanelProps) {
  const {
    pm,
    Panel,
    codex,
    mobile,
    PanelContent,
    input,
    PanelHeader,
    PanelTitle,
    settingsOpen,
    setSettingsOpen,
    PanelDescription,
    id,
    select,
    busy,
    list,
    setPrompt,
    running,
    setDeleteOpen,
    deleteOpen,
    execute,
    status,
    scroll,
    followOutput,
    setAwayFromEnd,
    pageId,
    fillPrompt,
    snapshot,
    blocked,
    workspaceId,
    decide,
    error,
    eventQuery,
    end,
    awayFromEnd,
    submitComposer,
    pageTitle,
    composer,
    prompt,
  } = useCodexPanel(props);
  return (
    <Panel
      open={codex.open}
      onOpenChange={codex.setOpen}
      modal={mobile}
      {...(mobile ? { direction: "right" as const, autoFocus: true } : {})}
    >
      <PanelContent
        {...(!mobile ? { side: "right" as const, showCloseButton: false } : {})}
        className="codex-panel"
        onOpenAutoFocus={(event) => {
          if (!mobile && input.current) {
            event.preventDefault();
            input.current.focus();
          }
        }}
        onInteractOutside={(event) => {
          if (!mobile) event.preventDefault();
        }}
      >
        <PanelHeader className="codex-header">
          <div className="codex-heading">
            <OpenAILogo width={26} height={26} />
            <PanelTitle>Codex</PanelTitle>
            <span className="codex-personal">
              <LockKeyhole size={11} /> Personnel
            </span>
            <div className="codex-header-actions">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Paramètres Codex"
                title="Paramètres Codex"
                aria-pressed={settingsOpen}
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <Settings2 size={16} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Fermer Codex"
                title="Fermer Codex"
                onClick={() => codex.setOpen(false)}
              >
                <X size={17} />
              </Button>
            </div>
          </div>
          <PanelDescription className="sr-only">
            Votre assistant personnel pour écrire et explorer cet espace
          </PanelDescription>
        </PanelHeader>
        <CodexHistory
          id={id}
          select={select}
          busy={busy}
          list={list}
          setPrompt={setPrompt}
          setSettingsOpen={setSettingsOpen}
          input={input}
          running={running}
          setDeleteOpen={setDeleteOpen}
        />
        {deleteOpen && (
          <div className="codex-delete">
            <p>Supprimer cette conversation et ses propositions ?</p>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void execute(async () => {
                  await client.codex.remove({ conversationId: id! });
                  select(null);
                  await list.refetch();
                })
              }
            >
              Supprimer
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Conserver
            </Button>
          </div>
        )}
        {status.data?.status !== "connected" || settingsOpen ? (
          <div className="codex-scroll">
            {settingsOpen && status.data?.status === "connected" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(false)}
              >
                <ArrowLeft size={14} /> Revenir à la conversation
              </Button>
            )}
            <CodexSettings />
          </div>
        ) : (
          <>
            <ContextToolbar
              workspaceId={workspaceId}
              context={pm.context.data}
              disabled={busy || running}
              onSubject={pm.changeSubject}
              onWorkflow={pm.chooseWorkflow}
              onRefresh={pm.refresh}
            />
            <CodexMessages
              scroll={scroll}
              followOutput={followOutput}
              setAwayFromEnd={setAwayFromEnd}
              running={running}
              id={id}
              codex={codex}
              pageId={pageId}
              busy={busy}
              fillPrompt={fillPrompt}
              snapshot={snapshot}
              blocked={blocked}
              workspaceId={workspaceId}
              decide={decide}
              error={error}
              eventQuery={eventQuery}
              list={list}
              end={end}
              execute={execute}
              select={select}
            />
            {awayFromEnd && (
              <Button
                className="codex-scroll-latest"
                size="sm"
                variant="outline"
                onClick={() => {
                  followOutput.current = true;
                  end.current?.scrollIntoView({ block: "nearest" });
                  setAwayFromEnd(false);
                }}
              >
                <ArrowDown size={14} /> Derniers messages
              </Button>
            )}
            <CodexComposer
              submitComposer={submitComposer}
              pageTitle={pageTitle}
              pageId={pageId}
              codex={codex}
              running={running}
              busy={busy}
              fillPrompt={fillPrompt}
              composer={composer}
              input={input}
              prompt={prompt}
              blocked={blocked}
              execute={execute}
              id={id}
              eventQuery={eventQuery}
            />
          </>
        )}
      </PanelContent>
    </Panel>
  );
}
