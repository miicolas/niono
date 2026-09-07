import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { getPage } from "@/server/services/pages/get-page";
import { pageIdInput } from "@/validators/pages";

export const pagesGetHandler = protectedProcedure
  .route({ method: "GET" })
  .input(pageIdInput)
  .handler(({ context, input }) => getPage(context.session.user.id, input.id));
