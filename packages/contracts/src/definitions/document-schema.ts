import { z } from "zod";
import { type DocumentNode } from "./document-node";
import { validateDocument } from "./validate-document";

export const documentSchema = z.custom<DocumentNode>(
  validateDocument,
  "Document invalide ou trop volumineux",
);
