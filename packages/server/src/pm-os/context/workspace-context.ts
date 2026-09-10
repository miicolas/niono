import { db, schema as s } from "@digipm/db";
import { and, eq, inArray } from "drizzle-orm";
import { workspaceRole, missing, type Connection } from "../../access";
import { sourceFor } from "../../codex/store/source-for";
import { listPages } from "../../pages/list-pages";
import { readPack } from "../pack/read-pack";
import { pmWorkflows } from "@digipm/contracts/pm-os";
export async function workspaceContext(
  userId: string,
  workspaceId: string,
  pageId?: string | null,
  subjectId?: string | null,
  connection: Connection = db,
) {
  await workspaceRole(connection, userId, workspaceId);
  const pages = await listPages(userId, workspaceId);
  const visible = new Map(pages.map((page) => [page.id, page]));
  if (pageId && !visible.has(pageId)) throw missing();
  const rows = await connection
    .select()
    .from(s.pmSubjects)
    .where(eq(s.pmSubjects.workspaceId, workspaceId))
    .limit(500);
  const subjects = rows
    .filter(
      (subject) =>
        visible.has(subject.pageId) && visible.has(subject.draftsPageId),
    )
    .map((subject) => ({
      ...subject,
      title: visible.get(subject.pageId)!.title,
    }));
  let inferred = subjectId === undefined ? null : subjectId;
  if (subjectId === undefined && pageId) {
    let current: string | null = pageId;
    for (let depth = 0; current && depth < 31; depth++) {
      const match = subjects.find((subject) => subject.pageId === current);
      if (match) {
        inferred = match.id;
        break;
      }
      current = visible.get(current)?.parentId ?? null;
    }
  }
  const selected = inferred
    ? subjects.find((subject) => subject.id === inferred)
    : null;
  if (inferred && !selected) throw missing();
  const [settingsRow] = await connection
    .select()
    .from(s.pmSettings)
    .where(eq(s.pmSettings.workspaceId, workspaceId));
  const settings =
    settingsRow && visible.has(settingsRow.companyPageId) ? settingsRow : null;
  const bindings = await connection
    .select()
    .from(s.pmContextBindings)
    .where(
      and(
        eq(s.pmContextBindings.workspaceId, workspaceId),
        inArray(s.pmContextBindings.scope, [
          "workspace",
          ...(selected ? [selected.id] : []),
        ]),
      ),
    )
    .limit(200);
  const references = [];
  for (const binding of bindings) {
    if (!visible.has(binding.pageId)) continue;
    const target = await sourceFor(
      connection,
      userId,
      workspaceId,
      binding.pageId,
    );
    references.push({
      pageId: binding.pageId,
      title: target.page.title,
      role: binding.role,
      subjectId: binding.subjectId,
      revision: target.document.revision,
      excerpt: target.document.plainText.slice(0, 800),
    });
  }
  const pack = await readPack();
  return {
    settings,
    subjects,
    selectedSubjectId: selected?.id ?? null,
    references,
    pages: pages.map(({ id, title, parentId }) => ({ id, title, parentId })),
    pack: pack
      ? {
          version: pack.version,
          sourceRevision: pack.sourceRevision,
          workflows: pmWorkflows,
        }
      : null,
  };
}
