import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { duplicatePage } from "@/server/services/pages/duplicate-page";
import { pageIdInput } from "@/validators/pages";

export const pagesDuplicateHandler = protectedProcedure
  .input(pageIdInput)
  .handler(({ context, input }) =>
    duplicatePage(context.session.user.id, input.id)
  );
