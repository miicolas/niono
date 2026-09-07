import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { createWorkspace } from "@/server/services/workspaces/create-workspace";
import { createWorkspaceInput } from "@/validators/workspaces";

export const workspacesCreateHandler = protectedProcedure
  .input(createWorkspaceInput)
  .handler(({ context, input }) =>
    createWorkspace(context.session.user.id, input.name)
  );
