import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { saveView } from "@/server/services/databases/save-view";
import { saveViewInput } from "@/validators/databases";

export const databasesSaveViewHandler = protectedProcedure
  .input(saveViewInput)
  .handler(({ context, input }) => saveView(context.session.user.id, input));
