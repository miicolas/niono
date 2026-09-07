import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { favoritePage } from "@/server/services/pages/favorite-page";
import { favoritePageInput } from "@/validators/pages";

export const pagesFavoriteHandler = protectedProcedure
  .input(favoritePageInput)
  .handler(({ context, input }) =>
    favoritePage(context.session.user.id, input.id, input.enabled)
  );
