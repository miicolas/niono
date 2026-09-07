import type { PageItem } from "./types";
export function sortedFavorites(pages: PageItem[]) {
  return pages
    .filter((p) => p.favorite)
    .sort((a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0));
}
