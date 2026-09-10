import { ORPCError } from "@orpc/server";

export const missing = () =>
  new ORPCError("NOT_FOUND", { message: "Page introuvable ou inaccessible." });
