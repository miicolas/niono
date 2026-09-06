import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@digipm/server";
export const client: RouterClient<AppRouter> = createORPCClient(
  new RPCLink({
    url: () => `${window.location.origin}/api/rpc`,
    fetch: (request, init) =>
      fetch(request, { ...init, credentials: "same-origin" }),
  }),
);
export const api = createTanstackQueryUtils(client);
