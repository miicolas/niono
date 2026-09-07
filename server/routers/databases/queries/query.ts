import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { queryEntries } from "@/server/services/databases/query-entries";
import { queryEntriesInput } from "@/validators/databases";

export const databasesQueryHandler = protectedProcedure
  .route({ method: "GET" })
  .input(queryEntriesInput)
  .handler(({ context, input }) =>
    queryEntries(context.session.user.id, input)
  );
