import { codexSendSchema } from "@digipm/contracts/codex";
import * as codexConnection from "../codex/connection";
import * as codexConversations from "../codex/conversations";
import { decideProposal } from "../codex/proposals";
import { z } from "zod";
import { idSchema } from "@digipm/contracts";
import { authenticated } from "./authenticated";

export const codexRoutes = {
  status: authenticated.handler(({ context }) =>
    codexConnection.connectionStatus(context.user.id),
  ),
  connect: authenticated.handler(({ context }) =>
    codexConnection.connect(context.user.id),
  ),
  disconnect: authenticated.handler(({ context }) =>
    codexConnection.disconnect(context.user.id),
  ),
  list: authenticated
    .input(z.object({ workspaceId: idSchema }))
    .handler(({ context, input }) =>
      codexConversations.listConversations(context.user.id, input.workspaceId),
    ),
  send: authenticated
    .input(codexSendSchema)
    .handler(({ context, input }) =>
      codexConversations.send(context.user.id, input),
    ),
  events: authenticated
    .input(
      z.object({
        conversationId: idSchema,
        after: z.string().max(100000).optional(),
      }),
    )
    .handler(({ context, input }) =>
      codexConversations.events(
        context.user.id,
        input.conversationId,
        input.after,
      ),
    ),
  interrupt: authenticated
    .input(z.object({ conversationId: idSchema }))
    .handler(({ context, input }) =>
      codexConversations.interrupt(context.user.id, input.conversationId),
    ),
  remove: authenticated
    .input(z.object({ conversationId: idSchema }))
    .handler(({ context, input }) =>
      codexConversations.removeConversation(
        context.user.id,
        input.conversationId,
      ),
    ),
  decide: authenticated
    .input(
      z.object({
        conversationId: idSchema,
        proposalId: idSchema,
        decision: z.enum(["apply", "reject"]),
        mode: z.enum(["replace", "insert"]).optional(),
      }),
    )
    .handler(({ context, input }) => decideProposal(context.user.id, input)),
};
