import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { getRequestSession } from "@/server/services/request-session";

/** Session de la requête courante, utilisable dans les `beforeLoad` des routes. */
export const getServerSession = createServerFn({ method: "GET" }).handler(() =>
  getRequestSession(new Headers(getRequestHeaders()))
);
