import { writeFile, mkdir } from "node:fs/promises";
import { db, pool, schema as s } from "../packages/db/src";
import { sql, eq } from "drizzle-orm";
import {
  createWorkspace,
  createPage,
  searchPages,
} from "../packages/server/src/pages";
import { getDatabase, queryEntries } from "../packages/server/src/databases";
import { viewSchema } from "../packages/contracts/src";
const uid = crypto.randomUUID();
await db.insert(s.user).values({
  id: uid,
  name: "Performance fixture",
  email: `perf-${uid}@example.test`,
});
const workspace = await createWorkspace(uid, "Performance fixture");
try {
  const base = await createPage(uid, {
    workspaceId: workspace.id,
    kind: "database",
    title: "100 000 entrées",
  });
  const { source } = await getDatabase(uid, base.id);
  console.log(
    "Création du jeu synthétique : 10 000 pages, 100 000 entrées, 20 propriétés.",
  );
  await db.execute(
    sql`INSERT INTO pages (id,workspace_id,title,created_by,position) SELECT gen_random_uuid(),${workspace.id},'Note '||i,${uid},i FROM generate_series(1,10000) i`,
  );
  await db.execute(
    sql`INSERT INTO pages (id,workspace_id,parent_id,title,created_by,position) SELECT gen_random_uuid(),${workspace.id},${base.id},'Projet '||i,${uid},i FROM generate_series(1,100000) i`,
  );
  await db.execute(
    sql`INSERT INTO database_entries (source_id,page_id,position) SELECT ${source.id},id,position FROM pages WHERE parent_id=${base.id}`,
  );
  await db.execute(
    sql`INSERT INTO page_documents (page_id,content,plain_text) SELECT id,'{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,title FROM pages WHERE workspace_id=${workspace.id} ON CONFLICT DO NOTHING`,
  );
  const properties = await db
    .insert(s.properties)
    .values(
      Array.from({ length: 20 }, (_, i) => ({
        sourceId: source.id,
        name: `Nombre ${i}`,
        type: "number" as const,
        position: i,
      })),
    )
    .returning();
  await db.execute(
    sql`INSERT INTO property_values (page_id,property_id,number_value) SELECT e.page_id,p.id,e.position::integer%1000 FROM database_entries e CROSS JOIN property_definitions p WHERE e.source_id=${source.id} AND p.source_id=${source.id} AND p.type='number'`,
  );
  await db.execute(sql`ANALYZE pages`);
  await db.execute(sql`ANALYZE database_entries`);
  await db.execute(sql`ANALYZE property_values`);
  async function measure(run: () => Promise<unknown>) {
    await run();
    const samples = [];
    for (let i = 0; i < 20; i++) {
      const started = performance.now();
      await run();
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    return {
      samples: 20,
      p50ms: Math.round(samples[9]!),
      p95ms: Math.round(samples[18]!),
      maxMs: Math.round(samples[19]!),
    };
  }
  const report = {
    date: new Date().toISOString(),
    runtime: process.version,
    fixture: { pages: 10000, entries: 100000, properties: 20, values: 2000000 },
    table: await measure(() =>
      queryEntries(uid, {
        pageId: base.id,
        config: viewSchema.parse({ layout: "table" }),
        offset: 0,
        limit: 50,
      }),
    ),
    filtered: await measure(() =>
      queryEntries(uid, {
        pageId: base.id,
        config: viewSchema.parse({
          layout: "table",
          filters: [
            { propertyId: properties[0]!.id, operator: "gt", value: "990" },
          ],
        }),
        offset: 0,
        limit: 50,
      }),
    ),
    search: await measure(() => searchPages(uid, workspace.id, "Projet 99999")),
  };
  await mkdir("docs/validation", { recursive: true });
  await writeFile(
    "docs/validation/benchmark.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error);
  throw error;
} finally {
  console.log("Suppression du jeu synthétique.");
  await db.delete(s.workspaces).where(eq(s.workspaces.id, workspace.id));
  await db.delete(s.user).where(eq(s.user.id, uid));
  await pool.end();
}
