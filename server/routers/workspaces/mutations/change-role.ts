import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { changeRole } from "@/server/services/workspaces/change-role";
import { changeRoleInput } from "@/validators/workspaces";

export const workspacesChangeRoleHandler = protectedProcedure
  .input(changeRoleInput)
  .handler(({ context, input }) => changeRole(context.session.user.id, input));
