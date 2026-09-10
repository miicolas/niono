import { client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { EventResult } from "../codex-panel/shared";
export function PmConversationActions({
  snapshot,
  workspaceId,
  busy,
  execute,
  select,
  refresh,
}: {
  snapshot: EventResult;
  workspaceId: string;
  busy: boolean;
  execute: (operation: () => Promise<void>) => Promise<void>;
  select: (id: string | null) => void;
  refresh: () => Promise<unknown>;
}) {
  const run = snapshot.pm?.runs.at(-1);
  const pending = snapshot.pm?.questionnaires.some(
    (question) => question.runId === run?.id && question.status === "pending",
  );
  if (!snapshot.conversation.pmPackVersion)
    return (
      <div className="pm-continue">
        <p>
          Retrouvez les workflows, questionnaires et fichiers PM-OS dans une
          conversation liée.
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || snapshot.conversation.status === "running"}
          onClick={() => {
            void execute(async () => {
              const result = await client.codex.send({
                workspaceId,
                continueFrom: snapshot.conversation.id,
                requestId: crypto.randomUUID(),
                prompt:
                  "Reprends cette conversation avec PM-OS en conservant les décisions utiles et les sources accessibles. Propose les prochaines étapes adaptées via un questionnaire.",
                pageId: snapshot.conversation.context.pageId,
              });
              select(result.conversationId);
              await refresh();
            });
          }}
        >
          Continuer avec PM-OS
        </Button>
      </div>
    );
  if (!snapshot.resumable || !run) return null;
  return (
    <div className="pm-continue">
      <p>
        {pending
          ? "Complétez le questionnaire sauvegardé, puis reprenez le travail."
          : "Les réponses, étapes et fichiers sont conservés. Vous pouvez reprendre cette demande."}
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={busy || pending}
        onClick={() => {
          void execute(async () => {
            await client.pm.resume({
              conversationId: snapshot.conversation.id,
              runId: run.id,
            });
            await refresh();
          });
        }}
      >
        Reprendre les étapes sauvegardées
      </Button>
    </div>
  );
}
