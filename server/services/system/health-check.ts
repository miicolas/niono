import { pool } from "@/db";
export async function healthCheck() {
  await pool.query("SELECT 1");
}
