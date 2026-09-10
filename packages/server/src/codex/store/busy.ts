import { ORPCError } from "@orpc/server";

export const busy = () =>
  new ORPCError("CONFLICT", {
    message: "Une demande Codex est déjà en cours.",
  });
