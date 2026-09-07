import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { createPage } from "@/server/services/pages/create-page";
import { createPageInput } from "@/validators/pages";

export const pagesCreateHandler = protectedProcedure
  .input(createPageInput)
  .handler(({ context, input }) => createPage(context.session.user.id, input));
