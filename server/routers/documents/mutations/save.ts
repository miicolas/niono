import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { saveDocument } from "@/server/services/documents/save-document";
import { saveDocumentInput } from "@/validators/documents";

export const documentsSaveHandler = protectedProcedure
  .input(saveDocumentInput)
  .handler(({ context, input }) =>
    saveDocument(context.session.user.id, input)
  );
