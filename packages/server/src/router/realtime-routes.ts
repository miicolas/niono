import { authenticated } from "./authenticated";
import { syncDocumentSchema, presenceSchema } from "@digipm/contracts/realtime";
import { syncDocument } from "../realtime/sync-document";
import { updatePresence } from "../realtime/update-presence";

export const realtimeRoutes = {
  sync: authenticated
    .input(syncDocumentSchema)
    .handler(({ context, input }) => syncDocument(context.user.id, input)),
  presence: authenticated
    .input(presenceSchema)
    .handler(({ context, input }) =>
      updatePresence(context.user, context.session.id, input),
    ),
};
