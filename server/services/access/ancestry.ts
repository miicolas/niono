import { sql } from "drizzle-orm";
import type { Connection } from "./connection";
import { missing } from "./errors";

export type Ancestor = {
  id: string;
  created_by: string;
  private_root: boolean;
  deleted_at: Date | null;
  parent_id: string | null;
};

/** Chaîne des ancêtres d'une page (elle comprise), refusée si elle n'atteint pas une racine. */
export async function ancestry(cx: Connection, pageId: string) {
  const result = await cx.execute<Ancestor>(
    sql`WITH RECURSIVE ancestry AS (SELECT id,parent_id,created_by,private_root,deleted_at,0 AS depth FROM pages WHERE id=${pageId} UNION ALL SELECT p.id,p.parent_id,p.created_by,p.private_root,p.deleted_at,a.depth+1 FROM pages p JOIN ancestry a ON p.id=a.parent_id WHERE a.depth<30) SELECT * FROM ancestry`
  );
  if (!result.rows.some((row) => row.parent_id === null)) {
    throw missing();
  }
  return result.rows;
}
