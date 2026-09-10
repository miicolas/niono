import { expect, test } from "vitest";
import { auth } from "../packages/server/src/auth";
import * as pages from "../packages/server/src/pages";
import {
  newQuestion,
  questionnaireSchema,
} from "../packages/contracts/src/questionnaire";
import type { DocumentNode } from "../packages/contracts/src";

test("le questionnaire est sauvegardé, relu et dupliqué sans perdre ses réponses", async () => {
  const user = (
    await auth.api.signUpEmail({
      body: {
        name: "Test questionnaire",
        email: `questionnaire-${crypto.randomUUID()}@example.test`,
        password: "Test-questionnaire-812!",
      },
    })
  ).user.id;
  const workspaceId = (
    await pages.createWorkspace(user, "Questionnaires de test")
  ).id;
  const page = await pages.createPage(user, { workspaceId });
  const value = questionnaireSchema.parse({
    title: "Cadrage",
    completed: true,
    questions: [
      { ...newQuestion(), prompt: "Quel objectif ?", text: "Publier le guide" },
    ],
  });
  const content: DocumentNode = {
    type: "doc",
    content: [
      {
        type: "questionnaire",
        attrs: { id: crypto.randomUUID(), questionnaire: value },
      },
    ],
  };
  await pages.saveDocument(user, {
    pageId: page.id,
    expectedRevision: 0,
    mutationId: crypto.randomUUID(),
    content,
  });
  const saved = await pages.getPage(user, page.id);
  expect(saved.document.content).toEqual(content);
  const copy = await pages.duplicatePage(user, page.id);
  const copied = (await pages.getPage(user, copy.id)).document.content;
  const copiedValue = questionnaireSchema.parse(
    copied.content?.[0]?.attrs?.questionnaire,
  );
  expect(copiedValue).toEqual({
    ...value,
    questions: value.questions.map((q) => ({ ...q, id: expect.any(String) })),
  });
  expect(copiedValue.questions[0]!.id).not.toBe(value.questions[0]!.id);
  expect(copied.content?.[0]?.attrs?.id).not.toBe(
    content.content?.[0]?.attrs?.id,
  );
  await expect(
    pages.saveDocument(user, {
      pageId: page.id,
      expectedRevision: 0,
      mutationId: crypto.randomUUID(),
      content,
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
});
