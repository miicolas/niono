import { db, schema as s, type Transaction } from "@digipm/db";
import { and, eq, sql, desc, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { createHash, randomUUID } from "node:crypto";
import {
  documentSchema,
  documentText,
  emptyDocument,
  type DocumentNode,
} from "@digipm/contracts";
import {
  audienceChange,
  accessPage,
  workspaceRole,
  withPage,
  lockWorkspace,
  missing,
} from "./access";

const welcome: DocumentNode = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Un endroit pour vos idées, vos projets et tout ce qui compte.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Faites comme chez vous" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Commencez à écrire, ou tapez / pour ajouter un bloc. Sélectionnez du texte pour le mettre en forme.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Écrire votre première idée" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Créer une page pour votre prochain projet",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Les grandes choses commencent souvent par une simple note.",
            },
          ],
        },
      ],
    },
    { type: "paragraph" },
  ],
};
async function insertWorkspace(tx: Transaction, userId: string, name: string) {
  const [workspace] = await tx
    .insert(s.workspaces)
    .values({ name, createdBy: userId })
    .returning();
  await tx
    .insert(s.members)
    .values({ workspaceId: workspace!.id, userId, role: "owner" });
  const [page] = await tx
    .insert(s.pages)
    .values({
      workspaceId: workspace!.id,
      title: "Bienvenue dans votre espace",
      icon: "✳️",
      createdBy: userId,
    })
    .returning();
  await tx.insert(s.documents).values({
    pageId: page!.id,
    content: welcome,
    plainText: documentText(welcome),
  });
  return workspace!;
}
export async function createWorkspace(userId: string, name: string) {
  return db.transaction((tx) => insertWorkspace(tx, userId, name));
}
export async function ensureWorkspace(userId: string) {
  return db.transaction(async (tx) => {
    await tx.select().from(s.user).where(eq(s.user.id, userId)).for("update");
    const [membership] = await tx
      .select()
      .from(s.members)
      .where(eq(s.members.userId, userId))
      .limit(1);
    if (membership) return membership.workspaceId;
    return (await insertWorkspace(tx, userId, "Mon espace")).id;
  });
}
export async function listWorkspaces(userId: string) {
  return db
    .select({
      id: s.workspaces.id,
      name: s.workspaces.name,
      icon: s.workspaces.icon,
      role: s.members.role,
    })
    .from(s.workspaces)
    .innerJoin(
      s.members,
      and(
        eq(s.workspaces.id, s.members.workspaceId),
        eq(s.members.userId, userId),
      ),
    );
}
export async function listPages(
  userId: string,
  workspaceId: string,
  trash = false,
) {
  await workspaceRole(db, userId, workspaceId);
  const result = await db.execute<{
    id: string;
  }>(sql`WITH RECURSIVE visible AS (
    SELECT p.id,p.parent_id, p.deleted_at IS NOT NULL AS trashed,0 AS depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
    UNION ALL SELECT p.id,p.parent_id,v.trashed OR p.deleted_at IS NOT NULL,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
  ) SELECT id FROM visible WHERE trashed=${trash} LIMIT 10000`);
  if (!result.rows.length) return [];
  return db
    .select({
      id: s.pages.id,
      workspaceId: s.pages.workspaceId,
      parentId: s.pages.parentId,
      title: s.pages.title,
      icon: s.pages.icon,
      cover: s.pages.cover,
      kind: s.pages.kind,
      position: s.pages.position,
      privateRoot: s.pages.privateRoot,
      createdBy: s.pages.createdBy,
      deletedAt: s.pages.deletedAt,
      updatedAt: s.pages.updatedAt,
      revision: s.pages.revision,
      favorite: s.favorites.pageId,
      favoritePosition: s.favorites.position,
    })
    .from(s.pages)
    .leftJoin(
      s.favorites,
      and(eq(s.favorites.pageId, s.pages.id), eq(s.favorites.userId, userId)),
    )
    .where(
      inArray(
        s.pages.id,
        result.rows.map((r) => r.id),
      ),
    )
    .orderBy(s.pages.position, s.pages.id);
}
export async function getPage(userId: string, pageId: string) {
  const access = await accessPage(db, userId, pageId);
  const [document] = await db
    .select()
    .from(s.documents)
    .where(eq(s.documents.pageId, pageId));
  await db
    .insert(s.recentPages)
    .values({ userId, pageId })
    .onConflictDoUpdate({
      target: [s.recentPages.userId, s.recentPages.pageId],
      set: { visitedAt: new Date() },
    });
  const grants =
    access.page.createdBy === userId
      ? await db
          .select({ userId: s.grants.userId, role: s.grants.role })
          .from(s.grants)
          .where(eq(s.grants.pageId, pageId))
      : [];
  return {
    ...access,
    grants,
    document: document!,
    aiAvailable: !!(process.env.AI_BASE_URL && process.env.AI_MODEL),
  };
}
export async function createPage(
  userId: string,
  input: {
    workspaceId: string;
    parentId?: string | null;
    title?: string;
    icon?: string;
    kind?: "page" | "database";
    content?: DocumentNode;
  },
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, input.workspaceId);
    if ((await workspaceRole(tx, userId, input.workspaceId)) === "viewer")
      throw new ORPCError("FORBIDDEN");
    if (input.parentId) {
      const parent = await accessPage(tx, userId, input.parentId, true);
      if (parent.page.workspaceId !== input.workspaceId) throw missing();
      const ancestry = await tx.execute<{ depth: number }>(
        sql`WITH RECURSIVE a AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id,a.depth+1 FROM pages p JOIN a ON p.id=a.parent_id WHERE a.depth<31) SELECT max(depth) depth FROM a`,
      );
      if (ancestry.rows[0]!.depth >= 30)
        throw new ORPCError("BAD_REQUEST", {
          message: "Limite de 30 niveaux de pages atteinte.",
        });
    }
    const content = documentSchema.parse(input.content ?? emptyDocument);
    const [page] = await tx
      .insert(s.pages)
      .values({
        workspaceId: input.workspaceId,
        parentId: input.parentId,
        title: input.title ?? "Sans titre",
        icon: input.icon ?? (input.kind === "database" ? "▦" : "📄"),
        kind: input.kind ?? "page",
        createdBy: userId,
        position: Date.now(),
      })
      .returning();
    await tx
      .insert(s.documents)
      .values({ pageId: page!.id, content, plainText: documentText(content) });
    if (input.parentId) {
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, input.parentId));
      if (source)
        await tx.insert(s.entries).values({
          sourceId: source.id,
          pageId: page!.id,
          position: Date.now(),
        });
    }
    if (input.kind === "database") {
      const [source] = await tx
        .insert(s.sources)
        .values({ pageId: page!.id, workspaceId: input.workspaceId })
        .returning();
      await tx.insert(s.properties).values({
        sourceId: source!.id,
        name: "Statut",
        type: "status",
        options: [
          { id: "todo", name: "À faire", color: "gray" },
          { id: "progress", name: "En cours", color: "blue" },
          { id: "done", name: "Terminé", color: "green" },
        ],
      });
      await tx.insert(s.views).values({
        sourceId: source!.id,
        name: "Table",
        config: {
          layout: "table",
          sortBy: "position",
          sortDirection: "asc",
          hidden: [],
          filters: [],
          filterMode: "and",
        },
      });
    }
    return page!;
  });
}
export async function updatePage(
  userId: string,
  input: {
    id: string;
    title?: string;
    icon?: string;
    cover?: string | null;
    coverPosition?: number;
    expectedRevision: number;
  },
) {
  return withPage(userId, input.id, async (tx, { page }) => {
    if (page.revision !== input.expectedRevision)
      throw new ORPCError("CONFLICT", {
        message: "Cette page a été modifiée. Rechargez ses informations.",
      });
    const { id, expectedRevision, ...changes } = input;
    const [updated] = await tx
      .update(s.pages)
      .set({ ...changes, revision: page.revision + 1, updatedAt: new Date() })
      .where(eq(s.pages.id, id))
      .returning();
    return updated!;
  });
}
export async function saveDocument(
  userId: string,
  input: {
    pageId: string;
    expectedRevision: number;
    mutationId: string;
    content: DocumentNode;
  },
) {
  const content = documentSchema.parse(input.content);
  const hash = createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  return withPage(userId, input.pageId, async (tx) => {
    const [receipt] = await tx
      .select()
      .from(s.receipts)
      .where(
        and(
          eq(s.receipts.pageId, input.pageId),
          eq(s.receipts.mutationId, input.mutationId),
          eq(s.receipts.actorId, userId),
        ),
      );
    if (receipt) {
      if (receipt.hash !== hash)
        throw new ORPCError("BAD_REQUEST", {
          message: "Identifiant de sauvegarde déjà utilisé.",
        });
      return { revision: receipt.revision };
    }
    const [old] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, input.pageId))
      .for("update");
    if (!old || old.revision !== input.expectedRevision)
      throw new ORPCError("CONFLICT", {
        message:
          "Une autre version a été enregistrée. Votre brouillon est conservé.",
        data: { revision: old?.revision },
      });
    const [last] = await tx
      .select()
      .from(s.versions)
      .where(eq(s.versions.pageId, input.pageId))
      .orderBy(desc(s.versions.createdAt))
      .limit(1);
    if (!last || Date.now() - last.createdAt.getTime() > 300000)
      await tx.insert(s.versions).values({
        pageId: input.pageId,
        content: old.content,
        revision: old.revision,
        authorId: userId,
      });
    const revision = old.revision + 1;
    await tx
      .update(s.documents)
      .set({
        content,
        plainText: documentText(content),
        revision,
        updatedAt: new Date(),
      })
      .where(eq(s.documents.pageId, input.pageId));
    await tx
      .update(s.pages)
      .set({ updatedAt: new Date() })
      .where(eq(s.pages.id, input.pageId));
    await tx.insert(s.receipts).values({
      pageId: input.pageId,
      mutationId: input.mutationId,
      actorId: userId,
      hash,
      revision,
    });
    return { revision };
  });
}
export async function movePage(
  userId: string,
  input: {
    id: string;
    parentId: string | null;
    beforeId?: string;
    confirmAudienceChange?: boolean;
    confirmedAudience?: { id: string; access: "read" | "edit" }[];
  },
) {
  return withPage(userId, input.id, async (tx, { page }) => {
    if (page.parentId !== input.parentId) {
      const expanded = await audienceChange(tx, page, input.parentId);
      const audienceKey = (audience: { id: string; access: string }[]) =>
        audience
          .map((p) => p.id + ":" + p.access)
          .sort()
          .join("|");
      if (
        expanded.length &&
        (!input.confirmAudienceChange ||
          audienceKey(expanded) !== audienceKey(input.confirmedAudience ?? []))
      )
        throw new ORPCError("PRECONDITION_FAILED", {
          message:
            "Ce déplacement donne de nouveaux accès. Confirmez les destinataires.",
          data: { audience: expanded },
        });
    }
    const [entry] = await tx
      .select()
      .from(s.entries)
      .where(eq(s.entries.pageId, page.id));
    if (entry && input.parentId !== page.parentId)
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Une entrée doit rester dans sa base. Dupliquez son contenu pour créer une page indépendante.",
      });
    if (input.parentId) {
      const target = await accessPage(tx, userId, input.parentId, true);
      if (target.page.workspaceId !== page.workspaceId) throw missing();
      const ancestors = await tx.execute<{ id: string }>(
        sql`WITH RECURSIVE a AS (SELECT id,parent_id FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id FROM pages p JOIN a ON p.id=a.parent_id) SELECT id FROM a`,
      );
      if (ancestors.rows.some((p) => p.id === page.id))
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Une page ne peut pas être placée dans ses propres sous-pages.",
        });
    }
    const descendants = await tx.execute<{ depth: number }>(
      sql`WITH RECURSIVE t AS (SELECT id,0 depth FROM pages WHERE id=${page.id} UNION ALL SELECT p.id,t.depth+1 FROM pages p JOIN t ON p.parent_id=t.id WHERE t.depth<31) SELECT max(depth) depth FROM t`,
    );
    const ancestors = input.parentId
      ? await tx.execute<{ depth: number }>(
          sql`WITH RECURSIVE t AS (SELECT id,parent_id,1 depth FROM pages WHERE id=${input.parentId} UNION ALL SELECT p.id,p.parent_id,t.depth+1 FROM pages p JOIN t ON p.id=t.parent_id WHERE t.depth<31) SELECT max(depth) depth FROM t`,
        )
      : null;
    if ((ancestors?.rows[0]?.depth ?? 0) + descendants.rows[0]!.depth >= 30)
      throw new ORPCError("BAD_REQUEST", {
        message: "Ce déplacement dépasserait 30 niveaux de pages.",
      });
    if (input.parentId && !entry) {
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, input.parentId));
      if (source)
        await tx.insert(s.entries).values({
          pageId: page.id,
          sourceId: source.id,
          position: Date.now(),
        });
    }
    let position = Date.now();
    if (input.beforeId) {
      const before = await accessPage(tx, userId, input.beforeId);
      if (
        before.page.workspaceId !== page.workspaceId ||
        before.page.parentId !== input.parentId
      )
        throw missing();
      const [previous] = await tx
        .select({ position: s.pages.position })
        .from(s.pages)
        .where(
          and(
            eq(s.pages.workspaceId, page.workspaceId),
            input.parentId
              ? eq(s.pages.parentId, input.parentId)
              : sql`${s.pages.parentId} IS NULL`,
            sql`${s.pages.id} <> ${page.id}`,
            sql`${s.pages.position} < ${before.page.position}`,
          ),
        )
        .orderBy(desc(s.pages.position))
        .limit(1);
      position = previous
        ? (previous.position + before.page.position) / 2
        : before.page.position - 1024;
      if (
        position === before.page.position ||
        position === previous?.position
      ) {
        const siblings = await tx
          .select()
          .from(s.pages)
          .where(
            and(
              eq(s.pages.workspaceId, page.workspaceId),
              input.parentId
                ? eq(s.pages.parentId, input.parentId)
                : sql`${s.pages.parentId} IS NULL`,
              sql`${s.pages.id} <> ${page.id}`,
            ),
          )
          .orderBy(s.pages.position, s.pages.id);
        for (const [index, sibling] of siblings.entries())
          await tx
            .update(s.pages)
            .set({ position: (index + 1) * 1024 })
            .where(eq(s.pages.id, sibling.id));
        position =
          (siblings.findIndex((p) => p.id === input.beforeId) + 1) * 1024 - 512;
      }
    }
    await tx
      .update(s.pages)
      .set({
        parentId: input.parentId,
        position,
        revision: page.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.pages.id, page.id));
    return { ok: true };
  });
}
export async function trashPage(userId: string, id: string, restore = false) {
  return withPage(
    userId,
    id,
    async (tx, { page }) => {
      let parentId = page.parentId;
      if (restore && parentId) {
        try {
          await accessPage(tx, userId, parentId, true);
        } catch {
          throw new ORPCError("PRECONDITION_FAILED", {
            message:
              "Restaurez d’abord la page parente afin de préserver les accès de cette sous-page.",
          });
        }
      }
      await tx
        .update(s.pages)
        .set({
          deletedAt: restore ? null : new Date(),
          parentId,
          updatedAt: new Date(),
        })
        .where(eq(s.pages.id, id));
      return { ok: true };
    },
    restore,
  );
}
export async function favoritePage(
  userId: string,
  id: string,
  enabled: boolean,
) {
  await accessPage(db, userId, id);
  if (enabled)
    await db
      .insert(s.favorites)
      .values({ pageId: id, userId, position: Date.now() })
      .onConflictDoNothing();
  else
    await db
      .delete(s.favorites)
      .where(and(eq(s.favorites.pageId, id), eq(s.favorites.userId, userId)));
  return { ok: true };
}
export async function listVersions(userId: string, id: string) {
  await accessPage(db, userId, id);
  return db
    .select({
      id: s.versions.id,
      revision: s.versions.revision,
      createdAt: s.versions.createdAt,
      content: s.versions.content,
      author: s.user.name,
    })
    .from(s.versions)
    .innerJoin(s.user, eq(s.user.id, s.versions.authorId))
    .where(eq(s.versions.pageId, id))
    .orderBy(desc(s.versions.createdAt))
    .limit(100);
}
export async function restoreVersion(
  userId: string,
  id: string,
  versionId: string,
  expectedRevision: number,
) {
  return withPage(userId, id, async (tx) => {
    const [v] = await tx
      .select()
      .from(s.versions)
      .where(and(eq(s.versions.id, versionId), eq(s.versions.pageId, id)));
    if (!v) throw missing();
    const [current] = await tx
      .select()
      .from(s.documents)
      .where(eq(s.documents.pageId, id));
    if (current!.revision !== expectedRevision) throw new ORPCError("CONFLICT");
    await tx.insert(s.versions).values({
      pageId: id,
      content: current!.content,
      revision: current!.revision,
      authorId: userId,
    });
    await tx
      .update(s.documents)
      .set({
        content: v.content,
        plainText: documentText(v.content),
        revision: current!.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(s.documents.pageId, id));
    await tx
      .update(s.pages)
      .set({ updatedAt: new Date() })
      .where(eq(s.pages.id, id));
    return { revision: current!.revision + 1 };
  });
}
export async function duplicatePage(userId: string, id: string) {
  return withPage(userId, id, async (tx, { page }) => {
    const tree = await tx.execute<{ id: string }>(
      sql`WITH RECURSIVE a AS (SELECT id FROM pages WHERE id=${id} UNION ALL SELECT p.id FROM pages p JOIN a ON p.parent_id=a.id WHERE p.deleted_at IS NULL) SELECT id FROM a LIMIT 201`,
    );
    if (tree.rows.length > 200)
      throw new ORPCError("BAD_REQUEST", {
        message: "Dupliquez au maximum 200 pages à la fois.",
      });
    const mapping = new Map(tree.rows.map((p) => [p.id, randomUUID()]));
    const propertyMapping = new Map<string, string>();
    const sourceMapping = new Map<string, string>();
    const assetMapping = new Map<string, string>();
    for (const row of tree.rows) {
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, row.id));
      for (const asset of assets) assetMapping.set(asset.id, randomUUID());
    }
    for (const row of tree.rows) {
      const { page: original } = await accessPage(tx, userId, row.id);
      const [doc] = await tx
        .select()
        .from(s.documents)
        .where(eq(s.documents.pageId, row.id));
      const copied = JSON.parse(JSON.stringify(doc!.content), (key, value) => {
        if (key === "id" && typeof value === "string") return randomUUID();
        if (key === "pageId" && mapping.has(value)) return mapping.get(value);
        if (typeof value === "string" && value.startsWith("/api/assets/")) {
          const assetId = value.slice("/api/assets/".length);
          if (assetMapping.has(assetId))
            return "/api/assets/" + assetMapping.get(assetId);
        }
        return value;
      }) as DocumentNode;
      const newId = mapping.get(row.id)!;
      const coverId = original.cover?.replace("/api/assets/", "");
      await tx.insert(s.pages).values({
        ...original,
        id: newId,
        title: row.id === id ? `${original.title} (copie)` : original.title,
        parentId:
          row.id === id ? page.parentId : mapping.get(original.parentId!)!,
        createdBy: userId,
        privateRoot: original.privateRoot,
        cover:
          coverId && assetMapping.has(coverId)
            ? "/api/assets/" + assetMapping.get(coverId)
            : original.cover,
        revision: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        position: Date.now(),
      });
      await tx.insert(s.documents).values({
        pageId: newId,
        content: copied,
        plainText: documentText(copied),
      });
      const assets = await tx
        .select()
        .from(s.assets)
        .where(eq(s.assets.pageId, row.id));
      for (const asset of assets)
        await tx
          .insert(s.assets)
          .values({ ...asset, id: assetMapping.get(asset.id)!, pageId: newId });
      const [source] = await tx
        .select()
        .from(s.sources)
        .where(eq(s.sources.pageId, row.id));
      if (source) {
        const sourceId = randomUUID();
        sourceMapping.set(source.id, sourceId);
        await tx
          .insert(s.sources)
          .values({ ...source, id: sourceId, pageId: newId });
        for (const property of await tx
          .select()
          .from(s.properties)
          .where(eq(s.properties.sourceId, source.id))) {
          const propertyId = randomUUID();
          propertyMapping.set(property.id, propertyId);
          await tx
            .insert(s.properties)
            .values({ ...property, id: propertyId, sourceId });
        }
        for (const view of await tx
          .select()
          .from(s.views)
          .where(eq(s.views.sourceId, source.id))) {
          const c = view.config;
          await tx.insert(s.views).values({
            ...view,
            id: randomUUID(),
            sourceId,
            revision: 0,
            config: {
              ...c,
              sortBy: propertyMapping.get(c.sortBy) ?? c.sortBy,
              groupBy: c.groupBy ? propertyMapping.get(c.groupBy) : undefined,
              hidden: c.hidden.map((id) => propertyMapping.get(id) ?? id),
              filters: c.filters.map((f) => ({
                ...f,
                propertyId: propertyMapping.get(f.propertyId) ?? f.propertyId,
              })),
            },
          });
        }
      }
    }
    for (const row of tree.rows) {
      const [entry] = await tx
        .select()
        .from(s.entries)
        .where(eq(s.entries.pageId, row.id));
      if (!entry) continue;
      const newId = mapping.get(row.id)!;
      await tx.insert(s.entries).values({
        ...entry,
        pageId: newId,
        sourceId: sourceMapping.get(entry.sourceId) ?? entry.sourceId,
        position: Date.now(),
      });
      for (const value of await tx
        .select()
        .from(s.values)
        .where(eq(s.values.pageId, row.id)))
        await tx.insert(s.values).values({
          ...value,
          pageId: newId,
          propertyId: propertyMapping.get(value.propertyId) ?? value.propertyId,
          arrayValue: value.arrayValue?.map((id) => assetMapping.get(id) ?? id),
          revision: 0,
        });
    }
    return { id: mapping.get(id)! };
  });
}
export async function searchPages(
  userId: string,
  workspaceId: string,
  query: string,
) {
  await workspaceRole(db, userId, workspaceId);
  const matched = await db.execute<{
    id: string;
    title: string;
    icon: string;
    excerpt: string;
  }>(sql`
    WITH RECURSIVE visible AS (
      SELECT p.id,0 depth FROM pages p WHERE p.workspace_id=${workspaceId} AND p.parent_id IS NULL AND p.deleted_at IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
      UNION ALL SELECT p.id,v.depth+1 FROM pages p JOIN visible v ON p.parent_id=v.id WHERE v.depth<30 AND p.workspace_id=${workspaceId} AND p.deleted_at IS NULL AND (NOT p.private_root OR p.created_by=${userId} OR EXISTS(SELECT 1 FROM page_grants g WHERE g.page_id=p.id AND g.user_id=${userId}))
    ) SELECT p.id,p.title,p.icon,left(d.plain_text,180) excerpt FROM pages p JOIN page_documents d ON d.page_id=p.id JOIN visible v ON v.id=p.id
    WHERE p.title ILIKE ${"%" + query.replace(/[%_\\]/g, "\\$&") + "%"} OR to_tsvector('simple',d.plain_text) @@ plainto_tsquery('simple',${query})
    ORDER BY ts_rank(to_tsvector('simple',d.plain_text),plainto_tsquery('simple',${query})) DESC,p.updated_at DESC,p.id LIMIT 40
  `);
  return matched.rows;
}

export async function previewMove(
  userId: string,
  id: string,
  parentId: string | null,
) {
  const { page } = await accessPage(db, userId, id, true);
  if (parentId) {
    const target = await accessPage(db, userId, parentId, true);
    if (target.page.workspaceId !== page.workspaceId) throw missing();
  }
  return { audience: await audienceChange(db, page, parentId) };
}

export async function recentPages(userId: string, workspaceId: string) {
  await workspaceRole(db, userId, workspaceId);
  const candidates = await db
    .select({
      id: s.pages.id,
      title: s.pages.title,
      icon: s.pages.icon,
      visitedAt: s.recentPages.visitedAt,
    })
    .from(s.recentPages)
    .innerJoin(s.pages, eq(s.pages.id, s.recentPages.pageId))
    .where(
      and(
        eq(s.recentPages.userId, userId),
        eq(s.pages.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(s.recentPages.visitedAt))
    .limit(100);
  const visible: typeof candidates = [];
  for (const page of candidates) {
    try {
      await accessPage(db, userId, page.id);
      visible.push(page);
      if (visible.length === 12) break;
    } catch {
      /* Revoked or trashed pages are excluded. */
    }
  }
  return visible;
}
export async function reorderFavorites(
  userId: string,
  workspaceId: string,
  ids: string[],
) {
  return db.transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    await workspaceRole(tx, userId, workspaceId);
    if (new Set(ids).size !== ids.length) throw new ORPCError("BAD_REQUEST");
    for (const [index, id] of ids.entries()) {
      const { page } = await accessPage(tx, userId, id);
      if (page.workspaceId !== workspaceId) throw missing();
      await tx
        .update(s.favorites)
        .set({ position: index * 1024 })
        .where(and(eq(s.favorites.userId, userId), eq(s.favorites.pageId, id)));
    }
    return { ok: true };
  });
}
