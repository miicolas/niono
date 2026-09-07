import { ORPCError } from "@orpc/server";
import { getRequestSession } from "@/server/services/request-session";
import { base } from "../context";

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const session = await getRequestSession(context.headers);
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Connectez-vous pour continuer.",
    });
  }
  return next({ context: { session } });
});
