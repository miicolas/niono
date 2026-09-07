import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { addEntry } from "@/server/services/databases/add-entry";
import { addEntryInput } from "@/validators/databases";

export const databasesAddEntryHandler = protectedProcedure
  .input(addEntryInput)
  .handler(({ context, input }) => addEntry(context.session.user.id, input));
