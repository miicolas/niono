/** Session Better Auth de la requête courante, ou null. */
export async function getRequestSession(headers: Headers) {
  const { auth } = await import("@/auth");
  return auth.api.getSession({ headers });
}
