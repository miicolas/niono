import { os, ORPCError } from "@orpc/server";
import { auth } from "../auth";

export const authenticated = os
  .$context<{ headers: Headers }>()
  .use(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });
    if (!session)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Connectez-vous pour continuer.",
      });
    return next({
      context: { ...context, user: session.user, session: session.session },
    });
  });
