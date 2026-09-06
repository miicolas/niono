import assert from "node:assert/strict";
import { base, jsonHeaders, signUp } from "./lib/http";
const mailbox = process.env.MAILPIT_URL ?? "http://localhost:18025";
const email = `auth-${crypto.randomUUID()}@example.test`;
const password = "Auth-fixture-local-2026!";
async function post(path: string, body: unknown, cookie = "") {
  return fetch(base + "/api/auth/" + path, {
    method: "POST",
    headers: { ...jsonHeaders, Cookie: cookie },
    body: JSON.stringify(body),
  });
}
const cookie = await signUp("Auth fixture", email, password);
assert.equal(
  (await post("update-user", { name: "Nouveau nom" }, cookie)).status,
  200,
);
assert.equal(
  (
    await post(
      "change-password",
      {
        currentPassword: "incorrect",
        newPassword: "New-password-local-2026!",
        revokeOtherSessions: true,
      },
      cookie,
    )
  ).status,
  400,
);
assert.equal(
  (
    await post(
      "change-password",
      {
        currentPassword: password,
        newPassword: "New-password-local-2026!",
        revokeOtherSessions: true,
      },
      cookie,
    )
  ).status,
  200,
);
assert.equal(
  (
    await post("request-password-reset", {
      email,
      redirectTo: base + "/reset-password",
    })
  ).status,
  200,
);
const listing = (await (await fetch(mailbox + "/api/v1/messages")).json()) as {
  messages: { ID: string; To: { Address: string }[] }[];
};
const message = listing.messages.find((m) =>
  m.To.some((to) => to.Address === email),
);
assert.ok(message, "Email de reset reçu");
const mail = (await (
  await fetch(mailbox + "/api/v1/message/" + message.ID)
).json()) as { Text: string };
const link = mail.Text.match(/https?:\/\/\S+/)?.[0];
assert.ok(link);
const token = new URL(link).pathname.split("/").at(-1)!;
const reset = await post("reset-password", {
  token,
  newPassword: "Reset-password-local-2026!",
});
assert.equal(reset.status, 200);
assert.notEqual(
  (
    await post("reset-password", {
      token,
      newPassword: "Replay-password-local-2026!",
    })
  ).status,
  200,
  "Jeton consommé non réutilisable",
);
const oldSession = await (
  await fetch(base + "/api/auth/get-session", { headers: { Cookie: cookie } })
).json();
assert.equal(oldSession, null, "Session révoquée après reset");
assert.equal(
  (
    await post("sign-in/email", {
      email,
      password: "Reset-password-local-2026!",
    })
  ).status,
  200,
);
assert.equal(
  (
    await post("request-password-reset", {
      email: `missing-${crypto.randomUUID()}@example.test`,
      redirectTo: base + "/reset-password",
    })
  ).status,
  200,
  "Aucune révélation de compte inexistant",
);
console.log(
  JSON.stringify(
    {
      status: "passed",
      checks: [
        "profil",
        "ancien mot de passe vérifié",
        "changement mot de passe",
        "SMTP reset",
        "reset",
        "jeton non réutilisable",
        "révocation session",
        "connexion nouveau mot de passe",
        "réponse non révélatrice",
      ],
    },
    null,
    2,
  ),
);
