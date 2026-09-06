import { exportArchive } from "./transfer/export-archive";
import { importArchive } from "./transfer/import-archive";
import { archiveSchema } from "@digipm/contracts";
import { os, ORPCError } from "@orpc/server";
import { z } from "zod";
import { auth } from "./auth";
import * as pages from "./pages";
import * as databases from "./databases";
import * as workspaces from "./workspaces";
import {
  documentSchema,
  idSchema,
  propertyTypeSchema,
  propertyOptionSchema,
  propertyValueSchema,
  viewSchema,
  safeUrl,
} from "@digipm/contracts";

const authenticated = os
  .$context<{ headers: Headers }>()
  .use(async ({ context, next }) => {
    const session = await auth.api.getSession({ headers: context.headers });
    if (!session)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Connectez-vous pour continuer.",
      });
    return next({ context: { ...context, user: session.user } });
  });
const pageId = z.object({ id: idSchema });
export const router = {
  transfer: {
    export: authenticated
      .input(
        z.object({
          pageId: idSchema,
          includeAssets: z.boolean().default(true),
        }),
      )
      .handler(({ context, input }) =>
        exportArchive(context.user.id, input.pageId, input.includeAssets),
      ),
    import: authenticated
      .input(
        z.object({
          workspaceId: idSchema,
          importId: idSchema,
          archive: archiveSchema,
        }),
      )
      .handler(({ context, input }) => importArchive(context.user.id, input)),
  },
  bootstrap: authenticated.handler(async ({ context }) => {
    const workspaceId = await pages.ensureWorkspace(context.user.id);
    return {
      user: context.user,
      workspaceId,
      workspaces: await pages.listWorkspaces(context.user.id),
    };
  }),
  workspace: {
    create: authenticated
      .input(z.object({ name: z.string().trim().min(1).max(100) }))
      .handler(({ context, input }) =>
        pages.createWorkspace(context.user.id, input.name),
      ),
    members: authenticated
      .input(z.object({ workspaceId: idSchema }))
      .handler(({ context, input }) =>
        workspaces.workspaceMembers(context.user.id, input.workspaceId),
      ),
    invite: authenticated
      .input(
        z.object({
          workspaceId: idSchema,
          email: z.email(),
          role: z.enum(["editor", "viewer"]),
        }),
      )
      .handler(({ context, input }) =>
        workspaces.inviteMember(context.user.id, input),
      ),
    accept: authenticated
      .input(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }))
      .handler(({ context, input }) =>
        workspaces.acceptInvitation(context.user.id, input.token),
      ),
    role: authenticated
      .input(
        z.object({
          workspaceId: idSchema,
          memberId: z.string(),
          role: z.enum(["editor", "viewer", "remove"]),
        }),
      )
      .handler(({ context, input }) =>
        workspaces.changeRole(context.user.id, input),
      ),
  },
  pages: {
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
      .handler(({ context, input }) =>
        pages.getPage(context.user.id, input.id),
      ),
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
      .handler(({ context, input }) =>
        pages.createPage(context.user.id, input),
      ),
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
      .handler(({ context, input }) =>
        pages.updatePage(context.user.id, input),
      ),
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
            .array(
              z.object({ id: z.string(), access: z.enum(["read", "edit"]) }),
            )
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
  },
  databases: {
    get: authenticated
      .input(pageId)
      .handler(({ context, input }) =>
        databases.getDatabase(context.user.id, input.id),
      ),
    addEntry: authenticated
      .input(z.object({ pageId: idSchema, title: z.string().max(300) }))
      .handler(({ context, input }) =>
        databases.addEntry(context.user.id, input),
      ),
    addProperty: authenticated
      .input(
        z.object({
          pageId: idSchema,
          name: z.string().min(1).max(100),
          type: propertyTypeSchema,
          options: z.array(propertyOptionSchema).max(100),
        }),
      )
      .handler(({ context, input }) =>
        databases.addProperty(context.user.id, input),
      ),
    saveView: authenticated
      .input(
        z.object({
          pageId: idSchema,
          id: idSchema.optional(),
          name: z.string().min(1).max(100),
          config: viewSchema,
          expectedRevision: z.number().int().nonnegative().optional(),
        }),
      )
      .handler(({ context, input }) =>
        databases.saveView(context.user.id, input),
      ),
    query: authenticated
      .input(
        z.object({
          pageId: idSchema,
          config: viewSchema,
          offset: z.number().int().min(0).max(1000000).default(0),
          limit: z.number().int().min(1).max(100).default(50),
          query: z.string().max(200).optional(),
          scope: z
            .union([
              z.object({
                propertyId: idSchema,
                value: z.string().max(100).nullable(),
              }),
              z.object({
                propertyId: idSchema,
                from: z.iso.date(),
                to: z.iso.date(),
              }),
            ])
            .optional(),
        }),
      )
      .handler(({ context, input }) =>
        databases.queryEntries(context.user.id, input),
      ),
    updateCell: authenticated
      .input(
        z.object({
          pageId: idSchema,
          propertyId: idSchema,
          value: propertyValueSchema,
          expectedRevision: z.number().int().nonnegative(),
        }),
      )
      .handler(({ context, input }) =>
        databases.updateCell(context.user.id, input),
      ),
  },
  ai: authenticated
    .input(
      z.object({
        pageId: idSchema,
        text: z.string().min(1).max(12000),
        instruction: z.string().min(1).max(1000),
      }),
    )
    .handler(async ({ context, input }) => {
      const { accessPage } = await import("./access");
      const { db } = await import("@digipm/db");
      await accessPage(db, context.user.id, input.pageId, true);
      const { rewriteText } = await import("./ai/rewrite-text");
      const text = await rewriteText(input).catch(() => {
        throw new ORPCError("BAD_GATEWAY", {
          message: "Le fournisseur IA n’a pas répondu correctement.",
        });
      });
      if (text === undefined)
        throw new ORPCError("PRECONDITION_FAILED", {
          message:
            "Configurez AI_MODEL (et AI_GATEWAY_API_KEY ou AI_BASE_URL) côté serveur pour activer l’assistant.",
        });
      return { text };
    }),
};
export type AppRouter = typeof router;
