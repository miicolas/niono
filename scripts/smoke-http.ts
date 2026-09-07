import assert from "node:assert/strict";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { base, signUp } from "./lib/http";

const password = "Smoke-test-local-2026!";
const prefix = crypto.randomUUID().slice(0, 8);
async function account(name: string) {
  const cookie = await signUp(name, `${name}-${prefix}@example.test`, password);
  const headers = { Cookie: cookie, Origin: base };
  const client: RouterClient<AppRouter> = createORPCClient(
    new RPCLink({ url: `${base}/api/rpc`, headers })
  );
  return { client, headers };
}
const started = performance.now();
assert.equal((await fetch(`${base}/api/health`)).status, 200);
const alice = await account("alice");
const bob = await account("bob");
const bootstrap = await alice.client.workspaces.bootstrap();
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
assert.deepEqual(await alice.client.documents.save(input), { revision: 1 });
assert.deepEqual(await alice.client.documents.save(input), { revision: 1 });
await assert.rejects(bob.client.pages.get({ id: page.id }), {
  code: "NOT_FOUND",
});
await assert.rejects(
  alice.client.documents.save({ ...input, mutationId: crypto.randomUUID() }),
  { code: "CONFLICT" }
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
  "Bonjour"
);
assert.equal(
  (await fetch(base + asset.url, { headers: bob.headers })).status,
  404
);
assert.equal((await fetch(base + asset.url)).status, 401);
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
  403
);
assert.equal(
  (await fetch(`${base}/api/rpc/bootstrap`, { headers: alice.headers })).status,
  405
);
assert.equal(
  (
    await fetch(`${base}/api/auth/sign-out`, {
      method: "POST",
      headers: { ...alice.headers, "Content-Type": "application/json" },
      body: "{}",
    })
  ).status,
  200
);
await assert.rejects(alice.client.workspaces.bootstrap(), {
  code: "UNAUTHORIZED",
});
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
        "CSRF",
        "déconnexion",
      ],
      durationMs: Math.round(performance.now() - started),
    },
    null,
    2
  )
);
