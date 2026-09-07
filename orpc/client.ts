import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins";
import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient,
} from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db } from "@/db";
import { appRouter } from "@/server/routers/_app";

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      context: () => ({
        headers: new Headers(getRequestHeaders()),
        db,
      }),
    })
  )
  .client((): RouterClient<typeof appRouter> => {
    const link = new RPCLink({
      url: () => `${window.location.origin}/api/rpc`,
      fetch: (request, init) =>
        fetch(request, { ...init, credentials: "same-origin" }),
      plugins: [
        new DedupeRequestsPlugin({
          filter: ({ request }) => request.method === "GET",
          groups: [{ condition: () => true, context: {} }],
        }),
        new BatchLinkPlugin({
          // Les imports d'archive dépassent la limite de corps d'un lot ordinaire.
          exclude: ({ path }) => path.join(".") === "transfer.import",
          groups: [{ condition: () => true, context: {} }],
        }),
      ],
    });
    return createORPCClient(link);
  });

export const orpcClient: RouterClient<typeof appRouter> = getORPCClient();

export type RouterInput = InferRouterInputs<typeof appRouter>;
export type RouterOutput = InferRouterOutputs<typeof appRouter>;

export const orpc = createTanstackQueryUtils(orpcClient);
