import { ORPCError } from "@orpc/server";

export const badRequest = (message: string) =>
  new ORPCError("BAD_REQUEST", { message });
