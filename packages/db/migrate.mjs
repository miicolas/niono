import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), {
  migrationsFolder: new URL("./migrations", import.meta.url).pathname,
});
await pool.end();
console.log("Migrations appliquées.");
