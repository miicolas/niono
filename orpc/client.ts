import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "@/server/routers/_app";
export const client: RouterClient<AppRouter> = createORPCClient(
  new RPCLink({
    url: () => `${window.location.origin}/api/rpc`,
    fetch: (request, init) =>
      fetch(request, { ...init, credentials: "same-origin" }),
  })
);
export const api = createTanstackQueryUtils(client);
