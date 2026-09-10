import { z } from "zod";
import {
  answerQuestionnaireSchema,
  contextBindingSchema,
  pmSubjectSchema,
  pmWorkspaceSchema,
} from "@digipm/contracts/pm-os";
import { authenticated } from "./authenticated";
import { workspaceContext } from "../pm-os/context/workspace-context";
import { configureWorkspace } from "../pm-os/context/configure-workspace";
import { createSubject } from "../pm-os/context/create-subject";
import { bindContext } from "../pm-os/context/bind-context";
import { answerQuestionnaire } from "../pm-os/questions/answer-questionnaire";
import { resumeRun } from "../pm-os/runs/resume-run";
import { previewArtifact } from "../pm-os/artifacts/preview-artifact";
export const pmRoutes = {
  context: authenticated
    .input(
      z.object({
        workspaceId: z.uuid(),
        pageId: z.uuid().nullable().optional(),
        subjectId: z.uuid().nullable().optional(),
      }),
    )
    .handler(({ context, input }) =>
      workspaceContext(
        context.user.id,
        input.workspaceId,
        input.pageId,
        input.subjectId,
      ),
    ),
  configure: authenticated
    .input(pmWorkspaceSchema)
    .handler(({ context, input }) =>
      configureWorkspace(context.user.id, input),
    ),
  createSubject: authenticated
    .input(pmSubjectSchema)
    .handler(({ context, input }) => createSubject(context.user.id, input)),
  bindContext: authenticated
    .input(contextBindingSchema)
    .handler(({ context, input }) => bindContext(context.user.id, input)),
  answer: authenticated
    .input(answerQuestionnaireSchema)
    .handler(({ context, input }) =>
      answerQuestionnaire(context.user.id, input),
    ),
  resume: authenticated
    .input(z.object({ conversationId: z.uuid(), runId: z.uuid() }))
    .handler(({ context, input }) =>
      resumeRun(context.user.id, input.conversationId, input.runId),
    ),
  preview: authenticated
    .input(z.object({ conversationId: z.uuid(), artifactId: z.uuid() }))
    .handler(({ context, input }) =>
      previewArtifact(context.user.id, input.conversationId, input.artifactId),
    ),
};
