// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { expect, test, vi } from "vitest";
import * as Y from "yjs";
import { client } from "@/lib/api";
import { DocumentProvider } from "@/features/realtime/document-provider";
import { CollaborativeDocument } from "../packages/editor/src/collaboration";

vi.mock("@/lib/api", () => ({
  client: { realtime: { sync: vi.fn(), presence: vi.fn(async () => {}) } },
}));

test("le fournisseur fusionne des brouillons hors ligne de deux onglets et reprend après un accusé perdu", async () => {
  const pageId = crypto.randomUUID(),
    workspaceId = crypto.randomUUID();
  const user = { id: crypto.randomUUID(), name: "Collaboration" };
  const server = new CollaborativeDocument(
    null,
    { type: "doc", content: [{ type: "paragraph" }] },
    "Titre",
  );
  let offline = false,
    loseAck = false,
    revision = 0;
  vi.mocked(client.realtime.sync).mockImplementation(async (input) => {
    if (offline) throw new Error("offline");
    const before = Buffer.from(server.snapshot().state).toString("base64");
    if (input.update) server.apply(Buffer.from(input.update, "base64"));
    if (Buffer.from(server.snapshot().state).toString("base64") !== before)
      revision++;
    if (loseAck) {
      loseAck = false;
      throw new Error("lost ack");
    }
    return {
      update: Buffer.from(
        server.diff(Buffer.from(input.vector, "base64")),
      ).toString("base64"),
      vector: Buffer.from(server.vector()).toString("base64"),
      revision,
      canEdit: true,
    };
  });
  const left = new DocumentProvider(pageId, user, workspaceId);
  const right = new DocumentProvider(pageId, user, workspaceId);
  try {
    await expect
      .poll(() => left.ready && right.ready && !left.dirty() && !right.dirty())
      .toBe(true);
    offline = true;
    left.document.getText("title").insert(0, "Alice ");
    right.document.getText("title").insert(0, "Bob ");
    await Promise.all([
      left.flush(),
      right.flush(),
      left.disk.flush(),
      right.disk.flush(),
    ]);
    expect(left.status).toBe("error");
    expect(left.dirty()).toBe(true);
    left.destroy();
    right.destroy();
    offline = false;
    const recovered = new DocumentProvider(pageId, user, workspaceId);
    try {
      await expect.poll(() => recovered.ready && !recovered.dirty()).toBe(true);
      expect(server.snapshot().title).toContain("Alice ");
      expect(server.snapshot().title).toContain("Bob ");
      recovered.document.getText("title").delete(0, 1);
      loseAck = true;
      await recovered.flush();
      expect(recovered.dirty()).toBe(true);
      const committed = revision;
      await recovered.flush();
      expect(recovered.status).toBe("saved");
      expect(recovered.dirty()).toBe(false);
      expect(revision).toBe(committed);
      expect(server.snapshot().title).toBe(
        recovered.document.getText("title").toString(),
      );
      const calls = vi.mocked(client.realtime.sync).mock.calls.length;
      await recovered.flush();
      expect(vi.mocked(client.realtime.sync).mock.calls.length).toBe(calls + 1);
      expect(
        vi.mocked(client.realtime.sync).mock.lastCall?.[0].update,
      ).toBeUndefined();
    } finally {
      recovered.destroy();
    }
  } finally {
    left.destroy();
    right.destroy();
    server.destroy();
  }
});
