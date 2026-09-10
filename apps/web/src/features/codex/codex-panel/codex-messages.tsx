import { PmRunContent } from "../pm-os/run-content";
import { PmConversationActions } from "../pm-os/conversation-actions";
import { AlertDescription, Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { MessageText } from "../message-text";
import { OpenAILogo } from "@/components/openai-logo";
import { Button } from "@/components/ui/button";
import { ProposalCard } from "./proposal-card";
import { type CodexPanelState } from "./codex-panel-state";
import { CodexWelcome } from "./codex-welcome";

export function CodexMessages({
  scroll,
  followOutput,
  setAwayFromEnd,
  running,
  id,
  codex,
  pageId,
  busy,
  fillPrompt,
  snapshot,
  blocked,
  workspaceId,
  decide,
  error,
  eventQuery,
  list,
  end,
  execute,
  select,
}: Pick<
  CodexPanelState,
  | "scroll"
  | "followOutput"
  | "setAwayFromEnd"
  | "running"
  | "id"
  | "codex"
  | "pageId"
  | "busy"
  | "fillPrompt"
  | "snapshot"
  | "blocked"
  | "workspaceId"
  | "decide"
  | "error"
  | "eventQuery"
  | "list"
  | "end"
  | "execute"
  | "select"
>) {
  return (
    <div
      className="codex-scroll"
      ref={scroll}
      onScroll={() => {
        const area = scroll.current;
        if (!area) return;
        const away =
          area.scrollHeight - area.scrollTop - area.clientHeight > 64;
        followOutput.current = !away;
        setAwayFromEnd(away);
      }}
      aria-label="Messages Codex"
      aria-busy={running}
    >
      <CodexWelcome
        id={id}
        codex={codex}
        pageId={pageId}
        busy={busy}
        fillPrompt={fillPrompt}
      />
      {id && !snapshot && !blocked && (
        <p role="status" className="codex-working">
          <Spinner className="animate-spin" /> Chargement de la conversation…
        </p>
      )}
      {!blocked &&
        snapshot?.messages?.map((message) => (
          <article key={message.id} className={`codex-message ${message.role}`}>
            <strong>
              {message.role !== "user" && <OpenAILogo width={19} height={19} />}
              {message.role === "user" ? "Vous" : "Codex"}
            </strong>
            <MessageText
              text={message.text}
              sources={snapshot.conversation.sources}
              workspaceId={workspaceId}
            />
            {message.error && (
              <Alert
                variant="destructive"
                role="alert"
                className="text-destructive"
              >
                <AlertDescription>{message.error}</AlertDescription>
              </Alert>
            )}
            {message.role === "assistant" && (
              <PmRunContent
                snapshot={snapshot}
                runId={message.requestId}
                workspaceId={workspaceId}
              />
            )}
          </article>
        ))}
      {!blocked &&
        snapshot?.proposals?.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            busy={busy}
            onDecide={decide}
          />
        ))}
      {!blocked && !!snapshot?.conversation.sources.length && (
        <div className="codex-sources">
          <strong>Pages consultées</strong>
          {snapshot.conversation.sources.map((source) => (
            <a
              key={source.pageId}
              href={`/?w=${workspaceId}&p=${source.pageId}`}
            >
              {source.title || "Sans titre"}
            </a>
          ))}
        </div>
      )}
      {(error || eventQuery.error || list.error) && (
        <Alert variant="destructive" role="alert" className="codex-error">
          <AlertDescription>
            {error ?? eventQuery.error?.message ?? list.error?.message}
          </AlertDescription>
        </Alert>
      )}
      {snapshot && !blocked && (
        <PmConversationActions
          snapshot={snapshot}
          workspaceId={workspaceId}
          busy={busy}
          execute={execute}
          select={select}
          refresh={() => eventQuery.refetch()}
        />
      )}
      {snapshot &&
        !snapshot.pm &&
        ["failed", "interrupted"].includes(snapshot.conversation.status) &&
        !blocked && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              fillPrompt(
                snapshot.messages
                  ?.filter((message) => message.role === "user")
                  .at(-1)?.text ?? "",
              )
            }
          >
            Reprendre la dernière demande
          </Button>
        )}
      {running && (
        <p role="status" className="codex-working">
          <Spinner className="animate-spin" />
          {snapshot?.conversation.status === "awaiting_input"
            ? "Codex attend vos réponses…"
            : "Codex travaille…"}
        </p>
      )}
      <div ref={end} />
    </div>
  );
}
