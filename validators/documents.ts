import { z } from "zod";
import type { DocumentNode } from "@/lib/editor/document-node";
import { validateDocument } from "@/lib/editor/validate-document";
import { idSchema } from "./common";

export const documentSchema = z.custom<DocumentNode>(
  validateDocument,
  "Document invalide ou trop volumineux"
);

const revisionSchema = z.number().int().nonnegative();

export const saveDocumentInput = z.object({
  pageId: idSchema,
  expectedRevision: revisionSchema,
  mutationId: idSchema,
  content: documentSchema,
});

export const listVersionsInput = z.object({ id: idSchema });

export const restoreVersionInput = z.object({
  id: idSchema,
  versionId: idSchema,
  expectedRevision: revisionSchema,
});
