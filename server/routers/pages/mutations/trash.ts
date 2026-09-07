import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { trashPage } from "@/server/services/pages/trash-page";
import { trashPageInput } from "@/validators/pages";

export const pagesTrashHandler = protectedProcedure
  .input(trashPageInput)
  .handler(({ context, input }) =>
    trashPage(context.session.user.id, input.id, input.restore)
  );
