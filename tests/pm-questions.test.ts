import { test, expect, vi } from "vitest";
import { db, schema as s } from "../packages/db/src";
import { eq } from "drizzle-orm";
import { pmFixture } from "./pm/fixture";
import { createQuestionnaire } from "../packages/server/src/pm-os/questions/create-questionnaire";
import { answerQuestionnaire } from "../packages/server/src/pm-os/questions/answer-questionnaire";
import { askQuestions } from "../packages/server/src/pm-os/questions/ask-questions";
import { nativeQuestions } from "../packages/server/src/pm-os/questions/native-questions";
import { activePmRuns } from "../packages/server/src/pm-os/runs/live";
const definition = {
  title: "Contexte manquant",
  questions: [
    {
      id: "audience",
      prompt: "Pour qui ?",
      kind: "single",
      options: ["Organisateurs", "Participants"],
      required: true,
    },
  ],
};
test("réponses partielles, validation serveur, double soumission et concurrence", async () => {
  const f = await pmFixture();
  const question = await createQuestionnaire(
    f.userId,
    f.conversationId,
    f.runId,
    "audience",
    definition,
  );
  expect(
    (
      await createQuestionnaire(
        f.userId,
        f.conversationId,
        f.runId,
        "audience",
        definition,
      )
    ).id,
  ).toBe(question.id);
  const id = question.definition.questions[0]!.id;
  const request = {
    conversationId: f.conversationId,
    questionnaireId: question.id,
    requestId: crypto.randomUUID(),
    expectedRevision: 0,
    submit: false,
    answers: {
      [id]: { selected: ["Organisateurs"], text: "", skipped: false },
    },
  };
  const partial = await answerQuestionnaire(f.userId, request);
  expect(partial.questionnaire.status).toBe("pending");
  await expect(
    answerQuestionnaire(f.userId, {
      ...request,
      expectedRevision: 1,
      answers: { [id]: { ...request.answers[id]!, selected: ["Inconnue"] } },
    }),
  ).rejects.toThrow();
  await expect(
    answerQuestionnaire(f.userId, {
      ...request,
      expectedRevision: 1,
      submit: true,
      answers: {},
    }),
  ).rejects.toThrow();
  const final = {
    ...request,
    expectedRevision: 1,
    submit: true,
    requestId: crypto.randomUUID(),
  };
  const submitted = await Promise.all([
    answerQuestionnaire(f.userId, final),
    answerQuestionnaire(f.userId, final),
  ]);
  expect(submitted.map((result) => result.questionnaire.revision)).toEqual([
    2, 2,
  ]);
  expect(submitted[0]?.needsResume).toBe(true);
  await expect(
    answerQuestionnaire(f.userId, {
      ...final,
      answers: {
        [id]: { ...request.answers[id]!, selected: ["Participants"] },
      },
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  await expect(
    answerQuestionnaire(crypto.randomUUID(), final),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
test("le moteur attend la soumission et suspend puis reprend son délai", async () => {
  const f = await pmFixture();
  const control = {
    signal: new AbortController().signal,
    pause: vi.fn(async () => {}),
    continue: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  };
  activePmRuns.set(f.runId, control);
  try {
    const waiting = askQuestions(
      f.userId,
      f.conversationId,
      f.runId,
      "context",
      definition,
    );
    await vi.waitFor(() => expect(control.pause).toHaveBeenCalledOnce());
    const [question] = await db
      .select()
      .from(s.pmQuestionnaires)
      .where(eq(s.pmQuestionnaires.runId, f.runId));
    const answer = {
      [question!.definition.questions[0]!.id]: {
        selected: ["Participants"],
        text: "",
        skipped: false,
      },
    };
    const request = {
      conversationId: f.conversationId,
      questionnaireId: question!.id,
      requestId: crypto.randomUUID(),
      expectedRevision: 0,
      answers: answer,
      submit: false,
    };
    await answerQuestionnaire(f.userId, request);
    expect(control.continue).not.toHaveBeenCalled();
    await answerQuestionnaire(f.userId, {
      ...request,
      expectedRevision: 1,
      submit: true,
    });
    expect(await waiting).toMatchObject({
      answers: [{ id: "audience", selected: ["Participants"] }],
    });
    expect(control.continue).toHaveBeenCalledOnce();
  } finally {
    activePmRuns.delete(f.runId);
  }
});
test("les demandes utilisateur natives utilisent les mêmes réponses persistées", async () => {
  const f = await pmFixture();
  activePmRuns.set(f.runId, {
    signal: new AbortController().signal,
    pause: async () => {},
    continue: async () => {},
    stop: async () => {},
  });
  try {
    const waiting = nativeQuestions(f.userId, f.conversationId, f.runId, {
      threadId: "native",
      turnId: "turn",
      itemId: "item",
      isBlocking: true,
      autoResolutionMs: null,
      questions: [
        {
          id: "why",
          header: "Objectif",
          question: "Quel objectif ?",
          isOther: true,
          isSecret: false,
          options: null,
        },
      ],
    });
    let question!: typeof s.pmQuestionnaires.$inferSelect;
    await vi.waitFor(async () => {
      [question] = (await db
        .select()
        .from(s.pmQuestionnaires)
        .where(eq(s.pmQuestionnaires.runId, f.runId))) as [
        typeof s.pmQuestionnaires.$inferSelect,
      ];
      expect(question).toBeDefined();
    });
    await answerQuestionnaire(f.userId, {
      conversationId: f.conversationId,
      questionnaireId: question.id,
      requestId: crypto.randomUUID(),
      expectedRevision: 0,
      submit: true,
      answers: {
        [question.definition.questions[0]!.id]: {
          selected: [],
          text: "Réduire le temps de préparation",
          skipped: false,
        },
      },
    });
    expect(await waiting).toEqual({
      answers: { why: { answers: ["Réduire le temps de préparation"] } },
    });
  } finally {
    activePmRuns.delete(f.runId);
  }
});
