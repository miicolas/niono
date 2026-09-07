import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { workspaceMembers } from "@/server/services/workspaces/members";
import { workspaceMembersInput } from "@/validators/workspaces";

export const workspacesMembersHandler = protectedProcedure
  .route({ method: "GET" })
  .input(workspaceMembersInput)
  .handler(({ context, input }) =>
    workspaceMembers(context.session.user.id, input.workspaceId)
  );
