import { searchMentionPeople } from "../pages/search-mention-people";
import { z } from "zod";
import * as pages from "../pages";
import * as workspaces from "../workspaces";
import { documentSchema, idSchema, safeUrl } from "@digipm/contracts";
import { authenticated } from "./authenticated";
import { pageId } from "./page-id";

export const pagesRoutes = {
  mentionPeople: authenticated
    .input(z.object({ workspaceId: idSchema, query: z.string().max(100) }))
    .handler(({ context, input }) =>
      searchMentionPeople(context.user.id, input.workspaceId, input.query),
    ),
  recent: authenticated
    .input(z.object({ workspaceId: idSchema }))
    .handler(({ context, input }) =>
      pages.recentPages(context.user.id, input.workspaceId),
    ),
  reorderFavorites: authenticated
    .input(
      z.object({ workspaceId: idSchema, ids: z.array(idSchema).max(1000) }),
    )
    .handler(({ context, input }) =>
      pages.reorderFavorites(context.user.id, input.workspaceId, input.ids),
    ),
  list: authenticated
    .input(
      z.object({ workspaceId: idSchema, trash: z.boolean().default(false) }),
    )
    .handler(({ context, input }) =>
      pages.listPages(context.user.id, input.workspaceId, input.trash),
    ),
  get: authenticated
    .input(pageId)
    .handler(({ context, input }) => pages.getPage(context.user.id, input.id)),
  create: authenticated
    .input(
      z.object({
        workspaceId: idSchema,
        parentId: idSchema.nullish(),
        title: z.string().max(300).optional(),
        icon: z.string().max(50).optional(),
        kind: z.enum(["page", "database"]).optional(),
        content: documentSchema.optional(),
      }),
    )
    .handler(({ context, input }) => pages.createPage(context.user.id, input)),
  update: authenticated
    .input(
      pageId.extend({
        title: z.string().max(300).optional(),
        icon: z.string().max(50).optional(),
        cover: z.string().refine(safeUrl).nullable().optional(),
        coverPosition: z.number().int().min(0).max(100).optional(),
        expectedRevision: z.number().int().nonnegative(),
      }),
    )
    .handler(({ context, input }) => pages.updatePage(context.user.id, input)),
  save: authenticated
    .input(
      z.object({
        pageId: idSchema,
        expectedRevision: z.number().int().nonnegative(),
        mutationId: idSchema,
        content: documentSchema,
      }),
    )
    .handler(({ context, input }) =>
      pages.saveDocument(context.user.id, input),
    ),
  previewMove: authenticated
    .input(pageId.extend({ parentId: idSchema.nullable() }))
    .handler(({ context, input }) =>
      pages.previewMove(context.user.id, input.id, input.parentId),
    ),
  move: authenticated
    .input(
      pageId.extend({
        parentId: idSchema.nullable(),
        beforeId: idSchema.optional(),
        confirmAudienceChange: z.boolean().optional(),
        confirmedAudience: z
          .array(z.object({ id: z.string(), access: z.enum(["read", "edit"]) }))
          .max(1000)
          .optional(),
      }),
    )
    .handler(({ context, input }) => pages.movePage(context.user.id, input)),
  trash: authenticated
    .input(pageId.extend({ restore: z.boolean().default(false) }))
    .handler(({ context, input }) =>
      pages.trashPage(context.user.id, input.id, input.restore),
    ),
  favorite: authenticated
    .input(pageId.extend({ enabled: z.boolean() }))
    .handler(({ context, input }) =>
      pages.favoritePage(context.user.id, input.id, input.enabled),
    ),
  duplicate: authenticated
    .input(pageId)
    .handler(({ context, input }) =>
      pages.duplicatePage(context.user.id, input.id),
    ),
  versions: authenticated
    .input(pageId)
    .handler(({ context, input }) =>
      pages.listVersions(context.user.id, input.id),
    ),
  restore: authenticated
    .input(
      pageId.extend({
        versionId: idSchema,
        expectedRevision: z.number().int().nonnegative(),
      }),
    )
    .handler(({ context, input }) =>
      pages.restoreVersion(
        context.user.id,
        input.id,
        input.versionId,
        input.expectedRevision,
      ),
    ),
  search: authenticated
    .input(z.object({ workspaceId: idSchema, query: z.string().max(200) }))
    .handler(({ context, input }) =>
      pages.searchPages(context.user.id, input.workspaceId, input.query),
    ),
  share: authenticated
    .input(
      z.object({
        pageId: idSchema,
        privateRoot: z.boolean(),
        grants: z
          .array(
            z.object({
              userId: z.string(),
              role: z.enum(["editor", "viewer"]),
            }),
          )
          .max(100),
      }),
    )
    .handler(({ context, input }) =>
      workspaces.sharePage(context.user.id, input),
    ),
};
