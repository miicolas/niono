import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { recentPages } from "@/server/services/pages/recent-pages";
import { recentPagesInput } from "@/validators/pages";

export const pagesRecentHandler = protectedProcedure
  .route({ method: "GET" })
  .input(recentPagesInput)
  .handler(({ context, input }) =>
    recentPages(context.session.user.id, input.workspaceId)
  );
