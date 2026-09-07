import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { inviteMember } from "@/server/services/workspaces/invite-member";
import { inviteMemberInput } from "@/validators/workspaces";

export const workspacesInviteHandler = protectedProcedure
  .input(inviteMemberInput)
  .handler(({ context, input }) =>
    inviteMember(context.session.user.id, input)
  );
