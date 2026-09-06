import { defineConfig } from "drizzle-kit";
import { env } from "@/env/server";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: env.DATABASE_URL },
});
