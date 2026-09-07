import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { searchPages } from "@/server/services/pages/search-pages";
import { searchPagesInput } from "@/validators/pages";

export const pagesSearchHandler = protectedProcedure
  .route({ method: "GET" })
  .input(searchPagesInput)
  .handler(({ context, input }) =>
    searchPages(context.session.user.id, input.workspaceId, input.query)
  );
