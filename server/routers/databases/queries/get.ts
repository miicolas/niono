import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { getDatabase } from "@/server/services/databases/get-database";
import { getDatabaseInput } from "@/validators/databases";

export const databasesGetHandler = protectedProcedure
  .route({ method: "GET" })
  .input(getDatabaseInput)
  .handler(({ context, input }) =>
    getDatabase(context.session.user.id, input.id)
  );
