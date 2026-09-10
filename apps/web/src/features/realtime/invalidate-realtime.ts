import type { QueryClient } from "@tanstack/react-query";

export function invalidateRealtime(cache: QueryClient, table: string) {
  const keys =
    table === "recent_pages"
      ? ["recent"]
      : table === "page_documents"
        ? ["versions", "search"]
        : table === "favorites"
          ? ["pages", "recent"]
          : table === "property_values"
            ? ["entries"]
            : table === "database_views" || table === "property_definitions"
              ? ["database", "entries"]
              : table.startsWith("codex_")
                ? ["codex-status", "codex-list", "codex-events"]
                : table.startsWith("pm_")
                  ? ["codex-list", "codex-events", "pm-artifact"]
                  : null;
  return cache.invalidateQueries(
    { predicate: (query) => !keys || keys.includes(String(query.queryKey[0])) },
    { cancelRefetch: true },
  );
}
