import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { ensureWorkspace } from "@/server/services/workspaces/ensure-workspace";
import { listWorkspaces } from "@/server/services/workspaces/list-workspaces";

export const workspacesBootstrapHandler = protectedProcedure
  .route({ method: "GET" })
  .handler(async ({ context }) => {
    const userId = context.session.user.id;
    const workspaceId = await ensureWorkspace(userId);
    return {
      user: context.session.user,
      workspaceId,
      workspaces: await listWorkspaces(userId),
    };
  });
