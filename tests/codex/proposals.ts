import { expect, test } from "vitest";
import {
  createPage,
  getPage,
  saveDocument,
  listVersions,
} from "../../packages/server/src/pages";
import { getDatabase, queryEntries } from "../../packages/server/src/databases";
import { decideProposal } from "../../packages/server/src/codex/proposals";
import { documentText, viewSchema } from "../../packages/contracts/src/index";
import { paragraphDocument as doc } from "../fixtures/paragraph-document";
import { suggestion } from "./suggestion";
import { apply } from "./apply";
import { owner, workspaceId, pageId, conversationId } from "./setup";

test("une proposition n’écrit rien avant application et l’application répétée est idempotente", async () => {
  const proposed = await suggestion(owner, conversationId, {
    type: "replaceDocument",
    pageId,
    expectedRevision: 0,
    content: doc("Texte amélioré"),
  });
  expect(documentText((await getPage(owner, pageId)).document.content)).toBe(
    "Bonjour le monde",
  );
  const [a, b] = await Promise.all([
    apply(owner, conversationId, proposed.proposalId),
    apply(owner, conversationId, proposed.proposalId),
  ]);
  expect(a.result).toEqual(b.result);
  expect((await getPage(owner, pageId)).document.revision).toBe(1);
  expect(documentText((await getPage(owner, pageId)).document.content)).toBe(
    "Texte amélioré",
  );
  expect((await listVersions(owner, pageId)).length).toBe(1);
});

test("chaque écriture IA crée un instantané même à moins de cinq minutes", async () => {
  const first = await suggestion(owner, conversationId, {
    type: "replaceDocument",
    pageId,
    expectedRevision: 0,
    content: doc("Un"),
  });
  await apply(owner, conversationId, first.proposalId);
  const second = await suggestion(owner, conversationId, {
    type: "replaceDocument",
    pageId,
    expectedRevision: 1,
    content: doc("Deux"),
  });
  await apply(owner, conversationId, second.proposalId);
  expect(
    (await listVersions(owner, pageId)).map((v) => v.revision).sort(),
  ).toEqual([0, 1]);
});

test("un refus est définitif et une saisie concurrente conserve le document", async () => {
  const rejected = await suggestion(owner, conversationId, {
    type: "renamePage",
    pageId,
    expectedRevision: 0,
    title: "Refusé",
  });
  await decideProposal(owner, {
    conversationId,
    proposalId: rejected.proposalId,
    decision: "reject",
  });
  await expect(
    apply(owner, conversationId, rejected.proposalId),
  ).rejects.toMatchObject({
    code: "CONFLICT",
  });
  const stale = await suggestion(owner, conversationId, {
    type: "replaceDocument",
    pageId,
    expectedRevision: 0,
    content: doc("IA"),
  });
  await saveDocument(owner, {
    pageId,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: doc("Saisie humaine"),
  });
  await expect(
    apply(owner, conversationId, stale.proposalId),
  ).rejects.toMatchObject({
    code: "CONFLICT",
  });
  expect(documentText((await getPage(owner, pageId)).document.content)).toBe(
    "Saisie humaine",
  );
});

test("création d’une page et d’une entrée en une seule transaction, sans doublon", async () => {
  const proposed = await suggestion(owner, conversationId, {
    type: "createPage",
    parentId: pageId,
    title: "Sous-page",
    content: doc("Créée"),
  });
  const [a, b] = await Promise.all([
    apply(owner, conversationId, proposed.proposalId),
    apply(owner, conversationId, proposed.proposalId),
  ]);
  expect(a.result?.pageId).toBe(b.result?.pageId);
  expect((await getPage(owner, a.result!.pageId)).page.parentId).toBe(pageId);
  const base = await createPage(owner, {
    workspaceId,
    kind: "database",
    title: "Tâches",
  });
  const entry = await suggestion(owner, conversationId, {
    type: "createEntry",
    pageId: base.id,
    title: "Une tâche",
    content: doc("Description"),
  });
  const applied = await apply(owner, conversationId, entry.proposalId);
  const entries = await queryEntries(owner, {
    pageId: base.id,
    config: viewSchema.parse({}),
    offset: 0,
    limit: 30,
  });
  expect(entries.rows.some((row) => row.id === applied.result?.pageId)).toBe(
    true,
  );
  const property = (await getDatabase(owner, base.id)).properties[0]!;
  const cell = await suggestion(owner, conversationId, {
    type: "updateCell",
    pageId: applied.result!.pageId,
    propertyId: property.id,
    expectedRevision: 0,
    value: "progress",
  });
  const [one, two] = await Promise.all([
    apply(owner, conversationId, cell.proposalId),
    apply(owner, conversationId, cell.proposalId),
  ]);
  expect(one.result?.revision).toBe(1);
  expect(two.result).toEqual(one.result);
});
