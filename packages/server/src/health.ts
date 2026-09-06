import { pool } from "@digipm/db";
export async function healthCheck() {
  await pool.query("SELECT 1");
}
