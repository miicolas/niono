import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./src/index";
await migrate(db, { migrationsFolder: "./packages/db/migrations" });
await pool.end();
console.log("Migrations appliquées.");
