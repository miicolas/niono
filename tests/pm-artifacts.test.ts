import { test, expect } from "vitest";
import { pmFixture } from "./pm/fixture";
import { createArtifact } from "../packages/server/src/pm-os/artifacts/create-artifact";
import { previewArtifact } from "../packages/server/src/pm-os/artifacts/preview-artifact";
import { readPmPage } from "../packages/server/src/pm-os/tools/read-page";
import { propose } from "../packages/server/src/codex/proposals/propose";
import { decideProposal } from "../packages/server/src/codex/proposals/decide-proposal";
import { workspaceContext } from "../packages/server/src/pm-os/context/workspace-context";
import { getPage, saveDocument } from "../packages/server/src/pages";
import { markdownDocument } from "../packages/server/src/pm-os/artifacts/markdown-document";
test("brouillon éditable, export révisé, idempotence et promotion explicite", async () => {
  const f = await pmFixture();
  const input = {
    key: "prd",
    title: "PRD activation",
    name: "prd.md",
    format: "markdown",
    text: "# Activation\n\n**Objectif** : réduire le temps de préparation.\n\n| Mesure | Cible |\n| --- | --- |\n| Temps | 10 min |\n\n- [ ] Mesurer le départ",
  };
  const [first, retry] = await Promise.all([
    createArtifact(f.userId, f.conversationId, f.runId, input),
    createArtifact(f.userId, f.conversationId, f.runId, input),
  ]);
  expect(first.id).toBe(retry.id);
  expect((await getPage(f.userId, first.pageId)).page.parentId).toBe(
    f.subject.draftsPageId,
  );
  expect(
    (await previewArtifact(f.userId, f.conversationId, first.id)).text,
  ).toContain("**Objectif**");
  await expect(
    createArtifact(f.userId, f.conversationId, f.runId, {
      ...input,
      text: "Autre texte",
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  const promotion = await propose(
    f.userId,
    f.conversationId,
    f.runId,
    {
      type: "rememberPage",
      pageId: first.pageId,
      subjectId: f.subject.id,
      role: "reference",
      expectedRevision: 0,
    },
    "Promouvoir le PRD en référence",
  );
  expect(
    (
      await workspaceContext(f.userId, f.workspaceId, first.pageId)
    ).references.some((ref) => ref.pageId === first.pageId),
  ).toBe(false);
  await decideProposal(f.userId, {
    conversationId: f.conversationId,
    proposalId: promotion.proposalId,
    decision: "apply",
  });
  expect(
    (
      await workspaceContext(f.userId, f.workspaceId, first.pageId)
    ).references.some((ref) => ref.pageId === first.pageId),
  ).toBe(true);
  await saveDocument(f.userId, {
    pageId: first.pageId,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content: markdownDocument("# PRD révisé"),
  });
  expect(
    await previewArtifact(f.userId, f.conversationId, first.id),
  ).toMatchObject({
    documentRevision: 1,
    exportRevision: 0,
    text: "# PRD révisé",
  });
});
test("conflits de référence, fichiers lisibles et contrôle d’accès", async () => {
  const f = await pmFixture();
  const artifact = await createArtifact(f.userId, f.conversationId, f.runId, {
    key: "csv",
    title: "Métriques",
    name: "metrics.csv",
    format: "csv",
    text: "metric,value\nactivation,0.42",
  });
  const page = await readPmPage(
    f.userId,
    f.conversationId,
    f.runId,
    artifact.pageId,
    0,
  );
  expect(page.assets).toHaveLength(1);
  expect(page.markdown).toContain("/api/assets/");
  await expect(
    previewArtifact(crypto.randomUUID(), f.conversationId, artifact.id),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  const promotion = await propose(
    f.userId,
    f.conversationId,
    f.runId,
    {
      type: "rememberPage",
      pageId: artifact.pageId,
      subjectId: f.subject.id,
      role: "metrics",
      expectedRevision: artifact.documentRevision,
    },
    "Retenir les métriques",
  );
  await saveDocument(f.userId, {
    pageId: artifact.pageId,
    expectedRevision: artifact.documentRevision,
    mutationId: crypto.randomUUID(),
    content: markdownDocument("Modifié"),
  });
  await expect(
    decideProposal(f.userId, {
      conversationId: f.conversationId,
      proposalId: promotion.proposalId,
      decision: "apply",
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
});
