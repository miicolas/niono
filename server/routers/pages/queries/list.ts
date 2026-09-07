import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { listPages } from "@/server/services/pages/list-pages";
import { listPagesInput } from "@/validators/pages";

export const pagesListHandler = protectedProcedure
  .route({ method: "GET" })
  .input(listPagesInput)
  .handler(({ context, input }) =>
    listPages(context.session.user.id, input.workspaceId, input.trash)
  );
