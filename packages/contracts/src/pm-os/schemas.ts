import { z } from "zod";

export const contextRoleSchema = z.enum([
  "company",
  "strategy",
  "style",
  "stakeholders",
  "research",
  "metrics",
  "decisions",
  "meetings",
  "reference",
]);
export const pmQuestionSchema = z.object({
  id: z.string().min(1).max(100),
  prompt: z.string().trim().min(1).max(500),
  kind: z.enum(["text", "single", "multiple"]),
  required: z.boolean().default(true),
  options: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  allowOther: z.boolean().default(true),
});
export const askQuestionsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  questions: z.array(pmQuestionSchema).min(1).max(3),
});
export const answerQuestionnaireSchema = z
  .object({
    conversationId: z.uuid(),
    questionnaireId: z.uuid(),
    requestId: z.uuid(),
    expectedRevision: z.number().int().nonnegative(),
    submit: z.boolean(),
    answers: z.record(
      z.string().max(100),
      z
        .object({
          selected: z.array(z.string().max(200)).max(20),
          text: z.string().max(4000),
          skipped: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();
export const pmWorkspaceSchema = z.object({
  workspaceId: z.uuid(),
  companyName: z.string().trim().min(1).max(200).default("Digitevent"),
  companyPageId: z.uuid().optional(),
});
export const pmSubjectSchema = z.object({
  workspaceId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  pageId: z.uuid().optional(),
  requestId: z.uuid(),
});
export const contextBindingSchema = z.object({
  workspaceId: z.uuid(),
  subjectId: z.uuid().nullable().default(null),
  pageId: z.uuid(),
  role: contextRoleSchema,
});
export const artifactFormatSchema = z.enum([
  "markdown",
  "csv",
  "json",
  "html",
  "image",
  "code",
  "zip",
]);
export const createArtifactSchema = z
  .object({
    key: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1).max(180),
    format: artifactFormatSchema,
    text: z.string().max(1000000).optional(),
    data: z.string().max(28000000).optional(),
    encoding: z.enum(["utf8", "base64"]).default("utf8"),
    description: z.string().max(30000).default(""),
  })
  .refine((value) => !!value.text || !!value.data, "Un contenu est requis");
export const reviewPersonas = [
  "engineer-reviewer",
  "designer-reviewer",
  "executive-reviewer",
  "legal-advisor",
  "uxr-analyst",
  "skeptic",
  "customer-voice",
] as const;
export const reviewSchema = z.object({
  pageId: z.uuid(),
  perspectives: z
    .array(z.enum(reviewPersonas))
    .min(1)
    .max(7)
    .default([...reviewPersonas]),
});
export const runnerFileSchema = z.object({
  path: z.string().min(1).max(200),
  content: z.string().max(1000000),
});
export const codeTaskSchema = z
  .object({
    key: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    runtime: z.enum(["python", "node", "prototype"]),
    entrypoint: z.string().min(1).max(200),
    files: z.array(runnerFileSchema).max(50),
    assetIds: z.array(z.uuid()).max(20).default([]),
  })
  .refine(
    (value) => value.files.some((file) => file.path === value.entrypoint),
    "Le fichier principal est requis",
  );
