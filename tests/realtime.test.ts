import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import { syncDocument } from "../packages/server/src/realtime/sync-document";
import { owner, editor, viewer, workspaceId } from "./content/setup";
import * as pages from "../packages/server/src/pages";
import { CollaborativeDocument } from "../packages/editor/src/collaboration";
import { sharePage } from "../packages/server/src/workspaces";
import { presenceSchema } from "../packages/contracts/src/realtime";

describe("collaboration persistante par l’interface publique", () => {
  it("valide les positions relatives des curseurs avant diffusion", () => {
    const document = new Y.Doc();
    const anchor = Y.createRelativePositionFromTypeIndex(
      document.getXmlFragment("default"),
      0,
    );
    const input = {
      pageId: crypto.randomUUID(),
      clientId: document.clientID,
      clock: 1,
      active: true,
      cursor: { anchor, head: anchor },
    };
    expect(presenceSchema.safeParse(input).success).toBe(true);
    expect(
      presenceSchema.safeParse({
        ...input,
        cursor: { anchor: "invalid", head: 123 },
      }).success,
    ).toBe(false);
    document.destroy();
  });
  it("fusionne titres et blocs concurrents, accepte les doublons et les reprises hors ligne", async () => {
    const page = await pages.createPage(owner, {
      workspaceId,
      title: "Départ",
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Bonjour" }] },
        ],
      },
    });
    const initial = await syncDocument(owner, {
      pageId: page.id,
      vector: "AA==",
    });
    const left = new Y.Doc(),
      right = new Y.Doc();
    Y.applyUpdate(left, Buffer.from(initial.update, "base64"));
    Y.applyUpdate(right, Buffer.from(initial.update, "base64"));
    left.getText("title").insert(0, "A ");
    right.getText("title").insert(0, "B ");
    const leftParagraph = left.getXmlFragment("default").get(0) as Y.XmlElement;
    const rightParagraph = right
      .getXmlFragment("default")
      .get(0) as Y.XmlElement;
    (leftParagraph.get(0) as Y.XmlText).insert(7, " Alice");
    (rightParagraph.get(0) as Y.XmlText).insert(7, " Bob");
    const requests = [left, right].map((document) => ({
      pageId: page.id,
      vector: Buffer.from(Y.encodeStateVector(document)).toString("base64"),
      update: Buffer.from(
        Y.encodeStateAsUpdate(document, Buffer.from(initial.vector, "base64")),
      ).toString("base64"),
    }));
    await Promise.all([
      syncDocument(owner, requests[0]!),
      syncDocument(editor, requests[1]!),
    ]);
    const beforeRetry = await pages.getPage(owner, page.id);
    await syncDocument(owner, requests[0]!);
    expect((await pages.getPage(owner, page.id)).document.revision).toBe(
      beforeRetry.document.revision,
    );
    for (const document of [left, right]) {
      const result = await syncDocument(owner, {
        pageId: page.id,
        vector: Buffer.from(Y.encodeStateVector(document)).toString("base64"),
      });
      Y.applyUpdate(document, Buffer.from(result.update, "base64"));
    }
    expect(left.getText("title").toString()).toBe(
      right.getText("title").toString(),
    );
    expect(left.getText("title").toString()).toContain("A ");
    expect(left.getText("title").toString()).toContain("B ");
    const persisted = await pages.getPage(owner, page.id);
    expect(persisted.document.plainText).toContain("Alice");
    expect(persisted.document.plainText).toContain("Bob");
    // An offline deletion is still applied, even when its state vector has not changed.
    left.getText("title").delete(0, 2);
    await syncDocument(owner, {
      pageId: page.id,
      vector: Buffer.from(Y.encodeStateVector(left)).toString("base64"),
      update: Buffer.from(Y.encodeStateAsUpdate(left)).toString("base64"),
    });
    expect((await pages.getPage(owner, page.id)).page.title).toBe(
      left.getText("title").toString(),
    );
    left.destroy();
    right.destroy();
  });

  it("garde les identifiants CRDT lors des remplacements historiques et des écritures Codex", async () => {
    const page = await pages.createPage(owner, {
      workspaceId,
      title: "Historique",
    });
    const initial = await syncDocument(owner, {
      pageId: page.id,
      vector: "AA==",
    });
    const replica = new CollaborativeDocument(
      Buffer.from(initial.update, "base64"),
      { type: "doc", content: [{ type: "paragraph" }] },
      "",
    );
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Modification serveur" }],
        },
      ],
    };
    await pages.saveDocument(owner, {
      pageId: page.id,
      expectedRevision: initial.revision,
      mutationId: crypto.randomUUID(),
      content,
    });
    const next = await syncDocument(owner, {
      pageId: page.id,
      vector: Buffer.from(replica.vector()).toString("base64"),
    });
    replica.apply(Buffer.from(next.update, "base64"));
    expect(replica.snapshot().content.content?.[0]?.content?.[0]?.text).toBe(
      "Modification serveur",
    );
    const versions = await pages.listVersions(owner, page.id);
    await pages.restoreVersion(owner, page.id, versions[0]!.id, next.revision);
    const restored = await syncDocument(owner, {
      pageId: page.id,
      vector: Buffer.from(replica.vector()).toString("base64"),
    });
    replica.apply(Buffer.from(restored.update, "base64"));
    expect(replica.snapshot().content).toEqual(
      (await pages.getPage(owner, page.id)).document.content,
    );
    replica.destroy();
  });

  it("refuse écriture lecteur, retrait de partage, espace étranger et données invalides sans persister", async () => {
    const page = await pages.createPage(owner, {
      workspaceId,
      title: "Sécurité",
    });
    const initial = await syncDocument(viewer, {
      pageId: page.id,
      vector: "AA==",
    });
    expect(initial.canEdit).toBe(false);
    const replica = new Y.Doc();
    Y.applyUpdate(replica, Buffer.from(initial.update, "base64"));
    replica.getText("title").insert(0, "Interdit ");
    await expect(
      syncDocument(viewer, {
        pageId: page.id,
        vector: "AA==",
        update: Buffer.from(Y.encodeStateAsUpdate(replica)).toString("base64"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await pages.getPage(owner, page.id)).page.title).toBe("Sécurité");
    await sharePage(owner, { pageId: page.id, privateRoot: true, grants: [] });
    await expect(
      syncDocument(editor, { pageId: page.id, vector: "AA==" }),
    ).rejects.toThrow();
    await expect(
      syncDocument("unrelated-user", { pageId: page.id, vector: "AA==" }),
    ).rejects.toThrow();
    await expect(
      syncDocument(owner, {
        pageId: page.id,
        vector: "AA==",
        update: "aW52YWxpZA==",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const [stored] = await db
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, page.id));
    expect(stored?.revision).toBe(initial.revision);
    replica.destroy();
  });
});
