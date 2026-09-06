import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "@/env/server";

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), {
  migrationsFolder: resolve(process.cwd(), "migrations"),
});
await pool.end();
console.info("Migrations appliquées.");
