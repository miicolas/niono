import { propose } from "../../packages/server/src/codex/proposals";
export function suggestion(
  owner: string,
  conversationId: string,
  action: unknown,
) {
  return propose(
    owner,
    conversationId,
    crypto.randomUUID(),
    action,
    "Modification proposée",
  );
}
