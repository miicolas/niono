import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { previewMove } from "@/server/services/pages/preview-move";
import { previewMoveInput } from "@/validators/pages";

export const pagesPreviewMoveHandler = protectedProcedure
  .route({ method: "GET" })
  .input(previewMoveInput)
  .handler(({ context, input }) =>
    previewMove(context.session.user.id, input.id, input.parentId)
  );
