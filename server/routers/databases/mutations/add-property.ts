import { protectedProcedure } from "@/server/procedure/protected.procedure";
import { addProperty } from "@/server/services/databases/add-property";
import { addPropertyInput } from "@/validators/databases";

export const databasesAddPropertyHandler = protectedProcedure
  .input(addPropertyInput)
  .handler(({ context, input }) => addProperty(context.session.user.id, input));
