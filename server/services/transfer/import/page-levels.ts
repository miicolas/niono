import type { Archive } from "@/validators/transfer";
import { badRequest } from "./bad-request";

const MAX_DEPTH = 30;

/** Groups pages by depth (root first); rejects cycles and trees deeper than 30 levels. */
export function pageLevels(pages: Archive["pages"]) {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const depths = new Map<string, number>();
  const depthOf = (
    page: Archive["pages"][number],
    path: Set<string>
  ): number => {
    const known = depths.get(page.id);
    if (known !== undefined) {
      return known;
    }
    if (path.has(page.id)) {
      throw badRequest("Arborescence cyclique ou limitée à 30 niveaux.");
    }
    path.add(page.id);
    const parent = page.parentId ? byId.get(page.parentId) : undefined;
    const depth = parent ? depthOf(parent, path) + 1 : 0;
    if (depth >= MAX_DEPTH) {
      throw badRequest("Arborescence cyclique ou limitée à 30 niveaux.");
    }
    depths.set(page.id, depth);
    return depth;
  };
  const levels: Archive["pages"][] = [];
  for (const page of pages) {
    const depth = depthOf(page, new Set());
    const level = levels[depth] ?? [];
    level.push(page);
    levels[depth] = level;
  }
  return levels;
}
