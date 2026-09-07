import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { rewritePageText } from "@/server/services/ai/rewrite-page-text";
import { rewriteTextInput } from "@/validators/ai";

export const aiRewriteHandler = protectedProcedure
  .input(rewriteTextInput)
  .handler(({ context, input }) =>
    rewritePageText(context.session.user.id, input)
  );
