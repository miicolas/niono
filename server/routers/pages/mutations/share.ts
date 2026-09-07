import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { sharePage } from "@/server/services/workspaces/share-page";
import { sharePageInput } from "@/validators/pages";

export const pagesShareHandler = protectedProcedure
  .input(sharePageInput)
  .handler(({ context, input }) => sharePage(context.session.user.id, input));
