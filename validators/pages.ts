import { z } from "zod";
import { safeUrl } from "@/lib/editor/safe-url";
import { idSchema } from "./common";
import { documentSchema } from "./documents";

const revisionSchema = z.number().int().nonnegative();
const titleSchema = z.string().max(300);
const iconSchema = z.string().max(50);

export const pageIdInput = z.object({ id: idSchema });

export const listPagesInput = z.object({
  workspaceId: idSchema,
  trash: z.boolean().default(false),
});

export const recentPagesInput = z.object({ workspaceId: idSchema });

export const searchPagesInput = z.object({
  workspaceId: idSchema,
  query: z.string().max(200),
});

export const previewMoveInput = pageIdInput.extend({
  parentId: idSchema.nullable(),
});

export const createPageInput = z.object({
  workspaceId: idSchema,
  parentId: idSchema.nullish(),
  title: titleSchema.optional(),
  icon: iconSchema.optional(),
  kind: z.enum(["page", "database"]).optional(),
  content: documentSchema.optional(),
});

export const updatePageInput = pageIdInput.extend({
  title: titleSchema.optional(),
  icon: iconSchema.optional(),
  cover: z.string().refine(safeUrl).nullable().optional(),
  coverPosition: z.number().int().min(0).max(100).optional(),
  expectedRevision: revisionSchema,
});

export const movePageInput = pageIdInput.extend({
  parentId: idSchema.nullable(),
  beforeId: idSchema.optional(),
  confirmAudienceChange: z.boolean().optional(),
  confirmedAudience: z
    .array(z.object({ id: z.string(), access: z.enum(["read", "edit"]) }))
    .max(1000)
    .optional(),
});

export const trashPageInput = pageIdInput.extend({
  restore: z.boolean().default(false),
});

export const favoritePageInput = pageIdInput.extend({ enabled: z.boolean() });

export const reorderFavoritesInput = z.object({
  workspaceId: idSchema,
  ids: z.array(idSchema).max(1000),
});

export const sharePageInput = z.object({
  pageId: idSchema,
  privateRoot: z.boolean(),
  grants: z
    .array(z.object({ userId: z.string(), role: z.enum(["editor", "viewer"]) }))
    .max(100),
});
