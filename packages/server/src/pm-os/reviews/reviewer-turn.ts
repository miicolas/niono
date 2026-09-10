import type { CodexRuntime } from "../../codex/runtime/codex-runtime";
export async function reviewerTurn(
  runtime: CodexRuntime,
  threadId: string,
  prompt: string,
  signal: AbortSignal,
): Promise<string> {
  signal.throwIfAborted();
  const messages = new Map<string, string>();
  let turnId: string | null = null;
  let dispose = () => {};
  let abort = () => {};
  const result = new Promise<string>((resolve, reject) => {
    abort = () => {
      if (turnId)
        void runtime
          .request("turn/interrupt", { threadId, turnId })
          .catch(() => {});
      reject(new Error("Relecture interrompue."));
    };
    signal.addEventListener("abort", abort, { once: true });
    dispose = runtime.on((event) => {
      if (event.method === "runtime/closed") {
        reject(new Error("Codex s’est arrêté."));
        return;
      }
      const p = event.params;
      if (p.threadId !== threadId) return;
      if (
        event.method === "item/agentMessage/delta" &&
        typeof p.itemId === "string" &&
        typeof p.delta === "string"
      )
        messages.set(
          p.itemId,
          ((messages.get(p.itemId) ?? "") + p.delta).slice(0, 30000),
        );
      if (event.method === "item/completed") {
        const item = p.item as
          { type?: string; id?: string; text?: string } | undefined;
        if (item?.type === "agentMessage" && item.id && item.text)
          messages.set(item.id, item.text.slice(0, 30000));
      }
      if (event.method === "turn/completed") {
        const turn = p.turn as { status?: string } | undefined;
        if (turn?.status === "completed")
          resolve([...messages.values()].join("\n\n").slice(0, 40000));
        else
          reject(
            new Error("La relecture n’a pas abouti. Vérifiez le quota Codex."),
          );
      }
      if (event.method === "error" && p.willRetry !== true)
        reject(new Error("La relecture a échoué."));
    });
  });
  void result.catch(() => {});
  try {
    const started = await runtime.request<{ turn: { id: string } }>(
      "turn/start",
      {
        threadId,
        environments: [],
        input: [{ type: "text", text: prompt, text_elements: [] }],
      },
    );
    turnId = started.turn.id;
    if (signal.aborted) abort();
    return await result;
  } finally {
    dispose();
    signal.removeEventListener("abort", abort);
  }
}
