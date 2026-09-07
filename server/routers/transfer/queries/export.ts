import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { exportArchive } from "@/server/services/transfer/export-archive";
import { exportArchiveInput } from "@/validators/transfer";

export const transferExportHandler = protectedProcedure
  .route({ method: "GET" })
  .input(exportArchiveInput)
  .handler(({ context, input }) =>
    exportArchive(context.session.user.id, input.pageId, input.includeAssets)
  );
