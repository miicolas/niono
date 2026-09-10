import { auth } from "../../packages/server/src/auth";

export async function account(name: string) {
  const result = await auth.api.signUpEmail({
    body: {
      name,
      email: `${name}-${crypto.randomUUID()}@example.test`,
      password: "Test-password-812!",
    },
    returnHeaders: true,
  });
  return {
    user: result.response.user,
    headers: new Headers({
      cookie: result.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; "),
    }),
  };
}
