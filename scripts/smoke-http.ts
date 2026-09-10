import assert from "node:assert/strict";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../packages/server/src";
const base = process.env.SMOKE_URL ?? "http://localhost:3003";
const password = "Smoke-test-local-2026!";
const prefix = crypto.randomUUID().slice(0, 8);
async function account(name: string) {
  const response = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      name,
      email: `${name}-${prefix}@example.test`,
      password,
    }),
  });
  assert.equal(response.status, 200, `Inscription ${name}`);
  const cookies = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.ok(cookies, "Cookie de session présent");
  const headers = { Cookie: cookies, Origin: base };
  const client: RouterClient<AppRouter> = createORPCClient(
    new RPCLink({ url: `${base}/api/rpc`, headers }),
  );
  return { client, headers };
}
const started = performance.now();
assert.equal((await fetch(`${base}/api/health`)).status, 200);
const alice = await account("alice");
const bob = await account("bob");
const bootstrap = await alice.client.bootstrap();
assert.equal(bootstrap.user.name, "alice");
const page = await alice.client.pages.create({
  workspaceId: bootstrap.workspaceId,
  title: "Test HTTP — accents 🌿",
});
const input = {
  pageId: page.id,
  expectedRevision: 0,
  mutationId: crypto.randomUUID(),
  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Enregistré via HTTP" }],
      },
    ],
  },
};
assert.deepEqual(await alice.client.pages.save(input), { revision: 1 });
assert.deepEqual(await alice.client.pages.save(input), { revision: 1 });
await assert.rejects(bob.client.pages.get({ id: page.id }), {
  code: "NOT_FOUND",
});
await assert.rejects(
  alice.client.pages.save({ ...input, mutationId: crypto.randomUUID() }),
  { code: "CONFLICT" },
);
const basePage = await alice.client.pages.create({
  workspaceId: bootstrap.workspaceId,
  title: "Base HTTP",
  kind: "database",
});
const metadata = await alice.client.databases.get({ id: basePage.id });
const entry = await alice.client.databases.addEntry({
  pageId: basePage.id,
  title: "Entrée HTTP",
});
await alice.client.databases.updateCell({
  pageId: entry.id,
  propertyId: metadata.properties[0]!.id,
  expectedRevision: 0,
  value: "progress",
});
const archive = await alice.client.transfer.export({
  pageId: basePage.id,
  includeAssets: true,
});
const imported = await alice.client.transfer.import({
  workspaceId: bootstrap.workspaceId,
  importId: crypto.randomUUID(),
  archive,
});
assert.equal(imported.pageIds.length, 1);
const file = await fetch(`${base}/api/assets/${page.id}`, {
  method: "POST",
  headers: {
    ...alice.headers,
    "Content-Type": "application/octet-stream",
    "X-File-Name": "hello.txt",
  },
  body: "Bonjour",
});
assert.equal(file.status, 200);
const asset = (await file.json()) as { url: string };
assert.equal(
  await (await fetch(base + asset.url, { headers: alice.headers })).text(),
  "Bonjour",
);
assert.equal(
  (await fetch(base + asset.url, { headers: bob.headers })).status,
  404,
);
assert.equal((await fetch(base + asset.url)).status, 401);
// Browser image requests must reach the authenticated route in development too.
const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const imageUpload = await fetch(`${base}/api/assets/${page.id}`, {
  method: "POST",
  headers: { ...alice.headers, "X-File-Name": "test.png" },
  body: imageBytes,
});
assert.equal(imageUpload.status, 200);
const imageAsset = (await imageUpload.json()) as { url: string };
const imageHeaders = {
  ...alice.headers,
  Accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "same-origin",
};
const imageResponse = await fetch(base + imageAsset.url, {
  headers: imageHeaders,
});
assert.equal(
  imageResponse.status,
  200,
  "Une balise img peut charger la ressource",
);
assert.equal(imageResponse.headers.get("Content-Type"), "image/png");
assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), imageBytes);
const imageDownload = await fetch(base + imageAsset.url + "?download=1", {
  headers: alice.headers,
});
assert.match(
  imageDownload.headers.get("Content-Disposition") || "",
  /^attachment;/,
);
assert.equal(
  (
    await fetch(base + imageAsset.url, {
      headers: { ...imageHeaders, Cookie: bob.headers.Cookie },
    })
  ).status,
  404,
);
assert.equal(
  (
    await fetch(`${base}/api/rpc/pages/trash`, {
      method: "POST",
      headers: {
        ...alice.headers,
        Origin: "https://other.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    })
  ).status,
  403,
);
assert.equal(
  (await fetch(`${base}/api/rpc/bootstrap`, { headers: alice.headers })).status,
  405,
);
assert.equal(
  (
    await fetch(`${base}/api/auth/sign-out`, {
      method: "POST",
      headers: { ...alice.headers, "Content-Type": "application/json" },
      body: "{}",
    })
  ).status,
  200,
);
await assert.rejects(alice.client.bootstrap(), { code: "UNAUTHORIZED" });
console.log(
  JSON.stringify(
    {
      status: "passed",
      checks: [
        "inscription",
        "session",
        "isolation",
        "sauvegarde",
        "idempotence",
        "conflit",
        "base",
        "cellule",
        "export-import",
        "fichier privé",
        "image privée et téléchargement",
        "CSRF",
        "déconnexion",
      ],
      durationMs: Math.round(performance.now() - started),
    },
    null,
    2,
  ),
);
