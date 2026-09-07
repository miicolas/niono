import { env } from "@/env/server";

/** Vrai si la requête vient de l'origine publique de l'application (protection CSRF des écritures). */
export function isSameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(env.BETTER_AUTH_URL).origin;
}
