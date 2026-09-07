import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { movePage } from "@/server/services/pages/move-page";
import { movePageInput } from "@/validators/pages";

export const pagesMoveHandler = protectedProcedure
  .input(movePageInput)
  .handler(({ context, input }) => movePage(context.session.user.id, input));
