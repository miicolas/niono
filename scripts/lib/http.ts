export const base = process.env.SMOKE_URL ?? "http://localhost:3000";
export const jsonHeaders = { "Content-Type": "application/json", Origin: base };
/** Creates an account through Better Auth and returns the session cookie header. */
export async function signUp(name: string, email: string, password: string) {
  const response = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name, email, password }),
  });
  if (response.status !== 200)
    throw new Error(`Inscription ${name} : HTTP ${response.status}`);
  const cookie = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) throw new Error("Cookie de session absent.");
  return cookie;
}
