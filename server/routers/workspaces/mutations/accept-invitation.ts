import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { acceptInvitation } from "@/server/services/workspaces/accept-invitation";
import { acceptInvitationInput } from "@/validators/workspaces";

export const workspacesAcceptInvitationHandler = protectedProcedure
  .input(acceptInvitationInput)
  .handler(({ context, input }) =>
    acceptInvitation(context.session.user.id, input.token)
  );
