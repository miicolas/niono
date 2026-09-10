import { expect, test } from "vitest";
import { db, schema as s } from "../packages/db/src";
import { ChangeFeed } from "../packages/db/src/change-feed";
import { eq, sql } from "drizzle-orm";
import { owner, editor, outsider, organizationId } from "./organization/setup";
import { createPage, updatePage } from "../packages/server/src/pages";
import { sharePage } from "../packages/server/src/workspaces";
import { realtimeStream } from "../packages/server/src/realtime/stream";
import { updatePresence } from "../packages/server/src/realtime/update-presence";
import { readPresence } from "../packages/server/src/realtime/read-presence";
import { auth } from "../packages/server/src/auth";
import { StreamProbe as StreamReader } from "../scripts/realtime/stream-probe";

test("PostgreSQL diffuse après commit, jamais après rollback, vers plusieurs instances", async () => {
  const first = new ChangeFeed(),
    second = new ChangeFeed();
  const received: string[][] = [[], []];
  const subscriptions = await Promise.all(
    [first, second].map((feed, index) =>
      feed.subscribe((change) => {
        if (change.pageId) received[index]!.push(change.pageId);
      }),
    ),
  );
  try {
    const page = await createPage(owner.user.id, {
      workspaceId: organizationId,
      title: "Diffusion",
    });
    await expect
      .poll(() => received.every((events) => events.includes(page.id)))
      .toBe(true);
    received.forEach((events) => events.splice(0));
    await expect(
      db.transaction(async (tx) => {
        await tx
          .update(s.pages)
          .set({ title: "Rollback" })
          .where(eq(s.pages.id, page.id));
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    // A committed barrier on the same database follows the aborted transaction.
    const barrier = await createPage(owner.user.id, {
      workspaceId: organizationId,
      title: "Barrière",
    });
    await expect
      .poll(() => received.every((events) => events.includes(barrier.id)))
      .toBe(true);
    expect(received.flat()).not.toContain(page.id);
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    first.close();
    second.close();
  }
});

test("le flux authentifié pousse les modifications et ferme une page dont le partage est retiré", async () => {
  const page = await createPage(owner.user.id, {
    workspaceId: organizationId,
    title: "Flux",
  });
  const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/realtime?workspaceId=${organizationId}&pageId=${page.id}`;
  expect((await realtimeStream(new Request(url))).status).toBe(401);
  expect(
    (await realtimeStream(new Request(url, { headers: outsider.headers })))
      .status,
  ).toBe(403);
  const response = await realtimeStream(
    new Request(url, {
      headers: editor.headers,
      signal: AbortSignal.timeout(8000),
    }),
  );
  expect(response.headers.get("content-type")).toBe("text/event-stream");
  const stream = new StreamReader(response);
  try {
    await stream.until("ready");
    await updatePage(owner.user.id, {
      id: page.id,
      expectedRevision: page.revision,
      title: "Mis à jour",
    });
    expect(await stream.until("change")).toEqual({ table: "pages" });
    await sharePage(owner.user.id, {
      pageId: page.id,
      privateRoot: true,
      grants: [],
    });
    expect(await stream.until("revoked")).toEqual({});
  } finally {
    await stream.close();
  }
});

test("la présence utilise l’identité de session, expire et refuse un pair d’un autre utilisateur", async () => {
  const page = await createPage(owner.user.id, {
    workspaceId: organizationId,
    title: "Présence",
  });
  const session = await auth.api.getSession({ headers: editor.headers });
  const ownerSession = await auth.api.getSession({ headers: owner.headers });
  const input = {
    pageId: page.id,
    clientId: 812,
    clock: 1,
    cursor: null,
    active: true,
  };
  await updatePresence(editor.user, session!.session.id, input);
  const peers = await readPresence(owner.user.id, page.id);
  expect(peers[0]?.state?.user.id).toBe(editor.user.id);
  await expect(
    updatePresence(owner.user, ownerSession!.session.id, input),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  await db
    .update(s.realtimePresence)
    .set({ expiresAt: new Date(0) })
    .where(eq(s.realtimePresence.pageId, page.id));
  expect(await readPresence(owner.user.id, page.id)).toEqual([]);
  await updatePresence(editor.user, session!.session.id, {
    ...input,
    clock: 2,
  });
  await sharePage(owner.user.id, {
    pageId: page.id,
    privateRoot: true,
    grants: [],
  });
  expect(await readPresence(owner.user.id, page.id)).toEqual([]);
  await expect(
    updatePresence(editor.user, session!.session.id, { ...input, clock: 3 }),
  ).rejects.toThrow();
});
