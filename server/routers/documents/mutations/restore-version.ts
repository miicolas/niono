import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { restoreVersion } from "@/server/services/documents/restore-version";
import { restoreVersionInput } from "@/validators/documents";

export const documentsRestoreVersionHandler = protectedProcedure
  .input(restoreVersionInput)
  .handler(({ context, input }) =>
    restoreVersion(
      context.session.user.id,
      input.id,
      input.versionId,
      input.expectedRevision
    )
  );
