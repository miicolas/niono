import { ORPCError } from "@orpc/server";

export const stale = () =>
  new ORPCError("CONFLICT", {
    message:
      "Le contenu a changé. Demandez une nouvelle proposition ; votre brouillon est conservé.",
  });
