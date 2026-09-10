import { ORPCError } from "@orpc/server";

export const tooLarge = () =>
  new ORPCError("BAD_REQUEST", {
    message:
      "L’archive est limitée à 200 pages et 16 Mo. Exportez un sous-ensemble.",
  });
