import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { listVersions } from "@/server/services/documents/list-versions";
import { listVersionsInput } from "@/validators/documents";

export const documentsVersionsHandler = protectedProcedure
  .route({ method: "GET" })
  .input(listVersionsInput)
  .handler(({ context, input }) =>
    listVersions(context.session.user.id, input.id)
  );
