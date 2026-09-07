import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/env/server";
import * as schema from "./schema";

export * as schema from "./schema";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
});

pool.on("error", (error) => {
  console.error("[db] idle client error", error);
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export type DatabaseTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;
/** @deprecated use DatabaseTransaction */
export type Transaction = DatabaseTransaction;
