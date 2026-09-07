import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { updateCell } from "@/server/services/databases/update-cell";
import { updateCellInput } from "@/validators/databases";

export const databasesUpdateCellHandler = protectedProcedure
  .input(updateCellInput)
  .handler(({ context, input }) => updateCell(context.session.user.id, input));
