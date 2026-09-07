import {
  workspacesAcceptInvitationHandler,
  workspacesChangeRoleHandler,
  workspacesCreateHandler,
  workspacesInviteHandler,
} from "./mutations";
import {
  workspacesBootstrapHandler,
  workspacesMembersHandler,
} from "./queries";

export const workspacesRouter = {
  bootstrap: workspacesBootstrapHandler,
  members: workspacesMembersHandler,
  create: workspacesCreateHandler,
  invite: workspacesInviteHandler,
  accept: workspacesAcceptInvitationHandler,
  role: workspacesChangeRoleHandler,
};
