import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { updatePage } from "@/server/services/pages/update-page";
import { updatePageInput } from "@/validators/pages";

export const pagesUpdateHandler = protectedProcedure
  .input(updatePageInput)
  .handler(({ context, input }) => updatePage(context.session.user.id, input));
