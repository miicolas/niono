import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { reorderFavorites } from "@/server/services/pages/reorder-favorites";
import { reorderFavoritesInput } from "@/validators/pages";

export const pagesReorderFavoritesHandler = protectedProcedure
  .input(reorderFavoritesInput)
  .handler(({ context, input }) =>
    reorderFavorites(context.session.user.id, input.workspaceId, input.ids)
  );
