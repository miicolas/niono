import { exportArchive, importArchive } from "../transfer";
import { archiveSchema } from "@digipm/contracts";
import { z } from "zod";
import { idSchema } from "@digipm/contracts";
import { authenticated } from "./authenticated";

export const transferRoutes = {
  export: authenticated
    .input(
      z.object({
        pageId: idSchema,
        includeAssets: z.boolean().default(true),
      }),
    )
    .handler(({ context, input }) =>
      exportArchive(context.user.id, input.pageId, input.includeAssets),
    ),
  import: authenticated
    .input(
      z.object({
        workspaceId: idSchema,
        importId: idSchema,
        archive: archiveSchema,
      }),
    )
    .handler(({ context, input }) => importArchive(context.user.id, input)),
};
