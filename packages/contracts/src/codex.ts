import { z } from "zod";
import { contextRoleSchema } from "./pm-os/schemas";
import { documentSchema, idSchema, propertyValueSchema } from "./index";

export const codexSelectionSchema = z
  .object({
    from: z.number().int().nonnegative(),
    to: z.number().int().positive(),
    text: z.string().min(1).max(12000),
    revision: z.number().int().nonnegative(),
  })
  .refine((value) => value.to > value.from, "Sélection invalide");
export type CodexSelection = z.infer<typeof codexSelectionSchema>;

export const codexActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("rememberPage"),
    pageId: idSchema,
    subjectId: idSchema.nullable(),
    role: contextRoleSchema,
    expectedRevision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("createPage"),
    parentId: idSchema.nullable(),
    title: z.string().trim().min(1).max(300),
    content: documentSchema,
  }),
  z.object({
    type: z.literal("createEntry"),
    pageId: idSchema,
    title: z.string().trim().min(1).max(300),
    content: documentSchema,
  }),
  z.object({
    type: z.literal("replaceDocument"),
    pageId: idSchema,
    expectedRevision: z.number().int().nonnegative(),
    content: documentSchema,
  }),
  z.object({
    type: z.literal("renamePage"),
    pageId: idSchema,
    expectedRevision: z.number().int().nonnegative(),
    title: z.string().trim().min(1).max(300),
  }),
  z.object({
    type: z.literal("updateCell"),
    pageId: idSchema,
    propertyId: idSchema,
    expectedRevision: z.number().int().nonnegative(),
    value: propertyValueSchema,
  }),
  z.object({
    type: z.literal("selection"),
    pageId: idSchema,
    selection: codexSelectionSchema,
    text: z.string().min(1).max(30000),
  }),
]);
export type CodexAction = z.infer<typeof codexActionSchema>;
export type CodexSource = { pageId: string; title: string; revision: number };
export type CodexRunState =
  | "idle"
  | "running"
  | "awaiting_input"
  | "completed"
  | "interrupted"
  | "failed";
export const codexSendSchema = z
  .object({
    workspaceId: idSchema,
    conversationId: idSchema.optional(),
    requestId: idSchema,
    prompt: z.string().trim().min(1).max(12000),
    pageId: idSchema.optional(),
    selection: codexSelectionSchema.optional(),
    subjectId: idSchema.nullable().optional(),
    workflowId: z.string().min(1).max(100).optional(),
    continueFrom: idSchema.optional(),
    resumeQuestionnaireId: idSchema.optional(),
  })
  .refine(
    (value) => !value.selection || !!value.pageId,
    "Page requise pour une sélection",
  );
