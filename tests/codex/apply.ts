import { decideProposal } from "../../packages/server/src/codex/proposals";
export function apply(
  owner: string,
  conversationId: string,
  id: string,
  mode?: "replace" | "insert",
) {
  return decideProposal(owner, {
    conversationId,
    proposalId: id,
    decision: "apply",
    mode,
  });
}
