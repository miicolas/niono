import assert from "node:assert/strict";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../packages/server/src/router/app-router";
import * as Y from "yjs";
import { StreamProbe } from "./realtime/stream-probe";

async function smokeRealtime() {
  const base = process.env.SMOKE_URL ?? "http://localhost:3011";
  const peer = process.env.SMOKE_PEER_URL ?? base;
  const headers = { "Content-Type": "application/json", Origin: base };
  const signup = await fetch(`${base}/api/auth/sign-up/email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Realtime HTTP",
      email: `realtime-http-${crypto.randomUUID()}@example.test`,
      password: "Realtime-http-test-812!",
    }),
  });
  assert.equal(signup.status, 200);
  const cookie = signup.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const rpc: RouterClient<AppRouter> = createORPCClient(
    new RPCLink({
      url: `${base}/api/rpc`,
      headers: { Cookie: cookie, Origin: base },
    }),
  );
  const boot = await rpc.bootstrap();
  const page = await rpc.pages.create({
    workspaceId: boot.workspaceId,
    title: "HTTP direct",
  });
  const initial = await rpc.realtime.sync({ pageId: page.id, vector: "AA==" });
  const local = new Y.Doc();
  Y.applyUpdate(local, Buffer.from(initial.update, "base64"));
  const probes = await Promise.all(
    [base, peer].map(
      async (origin) =>
        new StreamProbe(
          await fetch(
            `${origin}/api/realtime?workspaceId=${boot.workspaceId}&pageId=${page.id}`,
            {
              headers: { Cookie: cookie, Origin: origin },
              signal: AbortSignal.timeout(15000),
            },
          ),
        ),
    ),
  );
  try {
    await Promise.all(probes.map((probe) => probe.until("ready")));
    local.getText("title").insert(0, "Synchronisé ");
    const start = performance.now();
    await rpc.realtime.sync({
      pageId: page.id,
      vector: Buffer.from(Y.encodeStateVector(local)).toString("base64"),
      update: Buffer.from(
        Y.encodeStateAsUpdate(local, Buffer.from(initial.vector, "base64")),
      ).toString("base64"),
    });
    await Promise.all(probes.map((probe) => probe.until("change", "pages")));
    const latencyMs = Math.round(performance.now() - start);
    assert.equal(
      (await rpc.pages.get({ id: page.id })).page.title,
      "Synchronisé HTTP direct",
    );
    const signout = await fetch(`${base}/api/auth/sign-out`, {
      method: "POST",
      headers: { ...headers, Cookie: cookie },
      body: "{}",
    });
    assert.equal(signout.status, 200);
    await Promise.all(probes.map((probe) => probe.until("revoked")));
    console.log(
      JSON.stringify({
        status: "passed",
        transports: 2,
        distinctProcesses: base !== peer,
        committedTitle: true,
        sessionRevocation: true,
        latencyMs,
      }),
    );
  } finally {
    local.destroy();
    await Promise.all(probes.map((probe) => probe.close()));
  }
}

await smokeRealtime();
