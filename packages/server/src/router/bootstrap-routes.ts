import * as pages from "../pages";
import { authenticated } from "./authenticated";

export const bootstrapRoutes = authenticated.handler(async ({ context }) => {
  const initialWorkspaceId = await pages.ensureWorkspace(context.user.id);
  const workspaces = await pages.listWorkspaces(context.user.id);
  const workspaceId = workspaces.some(
    (workspace) => workspace.id === context.session.activeOrganizationId,
  )
    ? context.session.activeOrganizationId!
    : initialWorkspaceId;
  return {
    user: context.user,
    workspaceId,
    workspaces,
  };
});
