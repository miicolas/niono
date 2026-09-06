import { db, schema as s } from "@digipm/db";
import { and, eq, sql, inArray, asc, desc, or, type SQL } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import {
  emptyDocument,
  filterOperatorsFor,
  isChoiceType,
  isMultiValued,
  viewSchema,
  validatePropertyValue,
  type ViewConfig,
  type PropertyType,
  type PropertyOption,
  type PropertyValue,
} from "@digipm/contracts";
import { accessPage, withPage, missing, visibleTo } from "./access";
import { valueColumns, valueFrom } from "./property-values";

async function sourceFor(userId: string, pageId: string) {
  await accessPage(db, userId, pageId);
  const [source] = await db
    .select()
    .from(s.sources)
    .where(eq(s.sources.pageId, pageId));
  if (!source) throw missing();
  return source;
}
export async function getDatabase(userId: string, pageId: string) {
  const source = await sourceFor(userId, pageId);
  return {
    source,
    properties: await db
      .select()
      .from(s.properties)
      .where(eq(s.properties.sourceId, source.id))
      .orderBy(s.properties.position),
    views: await db
      .select()
      .from(s.views)
      .where(eq(s.views.sourceId, source.id)),
  };
}
export async function addEntry(
  userId: string,
  input: { pageId: string; title: string },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const [page] = await tx
      .insert(s.pages)
      .values({
        workspaceId: source.workspaceId,
        parentId: input.pageId,
        title: input.title,
        createdBy: userId,
        position: Date.now(),
      })
      .returning();
    await tx
      .insert(s.documents)
      .values({ pageId: page!.id, content: emptyDocument });
    await tx
      .insert(s.entries)
      .values({ sourceId: source.id, pageId: page!.id, position: Date.now() });
    return page!;
  });
}
export async function addProperty(
  userId: string,
  input: {
    pageId: string;
    name: string;
    type: PropertyType;
    options: PropertyOption[];
  },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const [property] = await tx
      .insert(s.properties)
      .values({
        sourceId: source.id,
        name: input.name,
        type: input.type,
        options: input.options,
        position: Date.now() % 2147483647,
      })
      .returning();
    return property!;
  });
}
export async function saveView(
  userId: string,
  input: {
    pageId: string;
    id?: string;
    name: string;
    config: ViewConfig;
    expectedRevision?: number;
  },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [source] = await tx
      .select()
      .from(s.sources)
      .where(eq(s.sources.pageId, input.pageId));
    if (!source) throw missing();
    const config = viewSchema.parse(input.config);
    if (input.id) {
      const [updated] = await tx
        .update(s.views)
        .set({ name: input.name, config, revision: sql`${s.views.revision}+1` })
        .where(
          and(
            eq(s.views.id, input.id),
            eq(s.views.sourceId, source.id),
            eq(s.views.revision, input.expectedRevision ?? 0),
          ),
        )
        .returning();
      if (!updated)
        throw new ORPCError("CONFLICT", {
          message: "La vue a changé. Rechargez-la.",
        });
      return updated;
    }
    const [view] = await tx
      .insert(s.views)
      .values({ sourceId: source.id, name: input.name, config })
      .returning();
    return view!;
  });
}
export async function updateCell(
  userId: string,
  input: {
    pageId: string;
    propertyId: string;
    value: PropertyValue;
    expectedRevision: number;
  },
) {
  return withPage(userId, input.pageId, async (tx) => {
    const [entry] = await tx
      .select()
      .from(s.entries)
      .where(eq(s.entries.pageId, input.pageId));
    if (!entry) throw missing();
    const [property] = await tx
      .select()
      .from(s.properties)
      .where(
        and(
          eq(s.properties.id, input.propertyId),
          eq(s.properties.sourceId, entry.sourceId),
        ),
      )
      .for("update");
    if (!property) throw missing();
    if (!validatePropertyValue(property.type, input.value, property.options))
      throw new ORPCError("BAD_REQUEST", {
        message: "Valeur incompatible avec cette propriété.",
      });
    if (property.type === "person" && Array.isArray(input.value)) {
      const { page } = await accessPage(tx, userId, input.pageId);
      for (const id of input.value) {
        const [member] = await tx
          .select()
          .from(s.members)
          .where(
            and(
              eq(s.members.workspaceId, page.workspaceId),
              eq(s.members.userId, id),
            ),
          );
        if (!member) throw missing();
      }
    }
    if (property.type === "files" && Array.isArray(input.value))
      for (const id of input.value) {
        const [asset] = await tx
          .select()
          .from(s.assets)
          .where(and(eq(s.assets.id, id), eq(s.assets.pageId, input.pageId)));
        if (!asset) throw missing();
      }
    const [old] = await tx
      .select()
      .from(s.values)
      .where(
        and(
          eq(s.values.pageId, input.pageId),
          eq(s.values.propertyId, input.propertyId),
        ),
      );
    if ((old?.revision ?? 0) !== input.expectedRevision)
      throw new ORPCError("CONFLICT", {
        message: "Cette cellule a été modifiée ailleurs.",
      });
    const value = input.value;
    const revision = (old?.revision ?? 0) + 1;
    const fields = { ...valueColumns(value), revision };
    await tx
      .insert(s.values)
      .values({ pageId: input.pageId, propertyId: input.propertyId, ...fields })
      .onConflictDoUpdate({
        target: [s.values.pageId, s.values.propertyId],
        set: fields,
      });
    return { revision, value };
  });
}
export async function queryEntries(
  userId: string,
  input: {
    pageId: string;
    config: ViewConfig;
    offset: number;
    limit: number;
    query?: string;
    scope?:
      | { propertyId: string; value: string | null }
      | { propertyId: string; from: string; to: string };
  },
) {
  const source = await sourceFor(userId, input.pageId);
  const properties = await db
    .select()
    .from(s.properties)
    .where(eq(s.properties.sourceId, source.id));
  const expr = (id: string): SQL => {
    if (id === "title") return sql`${s.pages.title}`;
    const property = properties.find((p) => p.id === id);
    if (!property)
      throw new ORPCError("BAD_REQUEST", { message: "Propriété inconnue." });
    const column =
      property.type === "number"
        ? sql`pv.number_value`
        : property.type === "checkbox"
          ? sql`pv.bool_value`
          : isMultiValued(property.type)
            ? sql`pv.array_value`
            : sql`pv.text_value`;
    return sql`(SELECT ${column} FROM property_values pv WHERE pv.page_id=${s.pages.id} AND pv.property_id=${id})`;
  };
  const filters = input.config.filters.map((f) => {
    const e = expr(f.propertyId);
    const property = properties.find((p) => p.id === f.propertyId);
    const type = property?.type ?? "text";
    const multiple = isMultiValued(type);
    if (!filterOperatorsFor(type).includes(f.operator))
      throw new ORPCError("BAD_REQUEST", {
        message: "Cet opérateur ne convient pas au type de la propriété.",
      });
    if (f.operator === "empty")
      return multiple
        ? sql`coalesce(jsonb_array_length(${e}),0)=0`
        : sql`(${e} IS NULL OR CAST(${e} AS text)='')`;
    const option = property?.options.find(
      (o) =>
        o.id === f.value ||
        o.name.toLocaleLowerCase() === f.value.toLocaleLowerCase(),
    );
    if (multiple) {
      const member = option?.id ?? f.value;
      return f.operator === "neq"
        ? sql`NOT coalesce(${e} ? ${member},false)`
        : sql`coalesce(${e} ? ${member},false)`;
    }
    const value =
      type === "number"
        ? Number(f.value)
        : type === "checkbox"
          ? f.value === "true"
          : (option?.id ?? f.value);
    if (
      (type === "number" && (!f.value.trim() || !Number.isFinite(value))) ||
      (type === "checkbox" && !["true", "false"].includes(f.value)) ||
      (type === "date" && !validatePropertyValue("date", f.value))
    )
      throw new ORPCError("BAD_REQUEST", {
        message: "La valeur du filtre est invalide.",
      });
    if (f.operator === "contains")
      return sql`CAST(${e} AS text) ILIKE ${"%" + f.value.replace(/[%_\\]/g, "\\$&") + "%"}`;
    if (f.operator === "eq") return sql`${e} = ${value}`;
    if (f.operator === "neq") return sql`(${e} IS NULL OR ${e} <> ${value})`;
    if (f.operator === "gt") return sql`${e} > ${value}`;
    return sql`${e} < ${value}`;
  });
  let scope: SQL | undefined;
  if (input.scope) {
    const property = properties.find((p) => p.id === input.scope!.propertyId);
    if (!property) throw new ORPCError("BAD_REQUEST");
    const e = expr(property.id);
    if ("value" in input.scope) {
      if (!isChoiceType(property.type)) throw new ORPCError("BAD_REQUEST");
      scope =
        input.scope.value === null
          ? sql`${e} IS NULL`
          : sql`${e} = ${input.scope.value}`;
    } else {
      if (
        property.type !== "date" ||
        !validatePropertyValue("date", input.scope.from) ||
        !validatePropertyValue("date", input.scope.to) ||
        input.scope.from > input.scope.to
      )
        throw new ORPCError("BAD_REQUEST");
      scope = sql`${e} >= ${input.scope.from} AND ${e} <= ${input.scope.to}`;
    }
  }
  const where = and(
    scope,
    eq(s.entries.sourceId, source.id),
    sql`${s.pages.deletedAt} IS NULL`,
    visibleTo(userId, "pages"),
    input.query
      ? sql`${s.pages.title} ILIKE ${"%" + input.query.replace(/[%_\\]/g, "\\$&") + "%"}`
      : undefined,
    filters.length
      ? input.config.filterMode === "or"
        ? or(...filters)
        : and(...filters)
      : undefined,
  );
  const order =
    input.config.sortBy === "position"
      ? sql`${s.entries.position}`
      : expr(input.config.sortBy);
  const list = await db
    .select({
      id: s.pages.id,
      title: s.pages.title,
      icon: s.pages.icon,
      cover: s.pages.cover,
      revision: s.pages.revision,
      createdAt: s.pages.createdAt,
      updatedAt: s.pages.updatedAt,
    })
    .from(s.entries)
    .innerJoin(s.pages, eq(s.pages.id, s.entries.pageId))
    .where(where)
    .orderBy(
      input.config.sortDirection === "asc" ? asc(order) : desc(order),
      asc(s.pages.id),
    )
    .limit(input.limit + 1)
    .offset(input.offset);
  const hasMore = list.length > input.limit;
  const selected = list.slice(0, input.limit);
  const propertyValues = selected.length
    ? await db
        .select()
        .from(s.values)
        .where(
          inArray(
            s.values.pageId,
            selected.map((r) => r.id),
          ),
        )
    : [];
  return {
    rows: selected.map((row) => ({
      ...row,
      values: Object.fromEntries(
        propertyValues
          .filter((v) => v.pageId === row.id)
          .map((v) => [
            v.propertyId,
            { value: valueFrom(v), revision: v.revision },
          ]),
      ),
    })),
    hasMore,
    nextOffset: input.offset + selected.length,
  };
}
