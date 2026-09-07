import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { importArchive } from "@/server/services/transfer/import-archive";
import { importArchiveInput } from "@/validators/transfer";

export const transferImportHandler = protectedProcedure
  .input(importArchiveInput)
  .handler(({ context, input }) =>
    importArchive(context.session.user.id, input)
  );
